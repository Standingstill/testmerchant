const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Stripe = require('stripe');
const dotenv = require('dotenv');

// Load environment variables from .env / .env.local if available
dotenv.config();
const localEnvPath = path.join(__dirname, '.env.local');
if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath, override: true });
}

const app = express();
const port = process.env.PORT || 3000;
const domain = process.env.DOMAIN || `http://localhost:${port}`;

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('[Startup] STRIPE_SECRET_KEY is not set. Stripe API calls will fail until it is configured.');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

// In-memory order store
const orders = new Map();

// Middleware setup
app.use(express.static(path.join(__dirname, 'public')));
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

const PRODUCT = {
  name: 'Test Headphones',
  description: 'High-fidelity over-ear headphones for integration testing.',
  amount: 9900,
  currency: 'usd',
};

app.post('/create-checkout-session', async (req, res) => {
  const { email } = req.body || {};

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Stripe secret key not configured.' });
    }

    const orderId = crypto.randomUUID();

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      metadata: {
        orderId,
        productName: PRODUCT.name,
        buyerEmail: email || '',
      },
      line_items: [
        {
          price_data: {
            currency: PRODUCT.currency,
            product_data: {
              name: PRODUCT.name,
              description: PRODUCT.description,
            },
            unit_amount: PRODUCT.amount,
          },
          quantity: 1,
        },
      ],
      customer_email: email || undefined,
      success_url: `${domain}/success.html?orderId=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domain}/cancel.html`,
    });

    const orderRecord = {
      orderId,
      sessionId: session.id,
      status: 'pending',
      amount: PRODUCT.amount,
      currency: PRODUCT.currency,
      email: email || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paymentIntentId: null,
      releaseTimestamp: null,
      refundId: null,
    };

    orders.set(orderId, orderRecord);

    console.log(`[Checkout] Created session ${session.id} for order ${orderId}`);

    return res.json({ url: session.url, orderId });
  } catch (error) {
    console.error('[Checkout] Failed to create session:', error);
    return res.status(500).json({ error: 'Unable to create checkout session.' });
  }
});

app.get('/orders', (req, res) => {
  const result = Array.from(orders.values());
  console.log('[Orders] Listing orders:', result.map((order) => ({ orderId: order.orderId, status: order.status })));
  res.json(result);
});

app.post('/orders/:id/release', (req, res) => {
  const { id } = req.params;
  const order = orders.get(id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  order.status = 'released';
  order.releaseTimestamp = new Date().toISOString();
  order.updatedAt = new Date().toISOString();
  orders.set(id, order);

  console.log(`[Orders] Release funds called for order ${id}`);

  res.json({ message: `Funds released for order ${id}.`, order });
});

app.post('/orders/:id/refund', async (req, res) => {
  const { id } = req.params;
  const order = orders.get(id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  if (!order.paymentIntentId) {
    return res.status(400).json({ error: 'Order has no captured payment to refund yet.' });
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: order.paymentIntentId,
    });

    order.status = 'refunded';
    order.refundId = refund.id;
    order.updatedAt = new Date().toISOString();
    orders.set(id, order);

    console.log(`[Orders] Refund created for order ${id}: refund ${refund.id}`);

    res.json({ message: `Refund initiated for order ${id}.`, refund, order });
  } catch (error) {
    console.error(`[Orders] Failed to refund order ${id}:`, error);
    res.status(500).json({ error: 'Unable to process refund for this order.' });
  }
});

app.post('/webhook', (req, res) => {
  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } else {
      const payload = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : req.body;
      event = JSON.parse(payload);
    }
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[Webhook] Received event: ${event.type}`);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;

    if (orderId && orders.has(orderId)) {
      const order = orders.get(orderId);
      order.status = 'paid';
      order.paymentIntentId = session.payment_intent;
      order.sessionId = session.id;
      order.updatedAt = new Date().toISOString();
      orders.set(orderId, order);

      console.log(`[Webhook] Order ${orderId} marked as paid (payment_intent=${session.payment_intent}).`);
    } else {
      console.warn(`[Webhook] Unknown order ID from session ${session.id}.`);
    }
  }

  res.json({ received: true });
});

app.listen(port, () => {
  console.log(`Merchant demo server running at ${domain}`);
});
