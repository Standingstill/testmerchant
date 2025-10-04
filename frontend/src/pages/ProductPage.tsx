import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const PRODUCT_AMOUNT = 9999;
const PRODUCT_NAME = 'Premium Wireless Headphones';
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount / 100);

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stripe || !elements) {
      setError('Payment form is still loading. Please wait a moment and try again.');
      return;
    }

    setLoading(true);
    setError(null);

    let createdOrderId: string | null = null;

    try {
      const intentResponse = await fetch('/api/payments/create-intent', {
        method: 'POST',
      });

      if (!intentResponse.ok) {
        throw new Error('Unable to start payment. Please try again.');
      }

      const intentData: { clientSecret: string; orderId: string; paymentIntentId: string } = await intentResponse.json();
      createdOrderId = intentData.orderId;

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Payment form is unavailable. Please refresh the page.');
      }

      const confirmation = await stripe.confirmCardPayment(intentData.clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (confirmation.error) {
        throw new Error(confirmation.error.message ?? 'Payment failed. Please try again.');
      }

      const confirmedIntent = confirmation.paymentIntent;
      if (!confirmedIntent) {
        throw new Error('Missing payment confirmation.');
      }

      const recordResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: intentData.orderId,
          paymentIntentId: confirmedIntent.id,
          productName: PRODUCT_NAME,
          amount: PRODUCT_AMOUNT,
          status: 'PAID',
        }),
      });

      if (!recordResponse.ok) {
        throw new Error('Unable to record your order. Please contact support.');
      }

      navigate(`/success?orderId=${intentData.orderId}&payment_intent=${confirmedIntent.id}`);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Unexpected error occurred.';
      if (createdOrderId) {
        navigate(`/error?orderId=${createdOrderId}&message=${encodeURIComponent(message)}`);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Payment details</div>
        <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/60 p-4">
          <CardElement
            options={{
              style: {
                base: {
                  color: '#ffffff',
                  fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  fontSize: '16px',
                  '::placeholder': {
                    color: '#94a3b8',
                  },
                },
                invalid: {
                  color: '#fca5a5',
                },
              },
            }}
            onChange={(event) => setCardComplete(event.complete)}
          />
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Use the Stripe test card <span className="font-semibold text-white">4242 4242 4242 4242</span> with any future expiration date and
          CVC 123.
        </p>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading || !cardComplete}
        className="inline-flex w-full items-center justify-center rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-indigo-500/60"
      >
        {loading ? 'Processing…' : 'Pay Now'}
      </button>
    </form>
  );
}

function ProductPage() {
  if (!publishableKey || !stripePromise) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center text-white">
        <div className="max-w-md space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-8">
          <h1 className="text-2xl font-semibold">Stripe not configured</h1>
          <p className="text-sm text-slate-300">
            Set <span className="font-mono text-xs">VITE_STRIPE_PUBLISHABLE_KEY</span> in the frontend environment before running the store.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="text-lg font-semibold tracking-tight">Aurora Audio</div>
          <nav className="hidden gap-6 text-sm text-slate-300 sm:flex">
            <span className="hover:text-white">Product</span>
            <span className="hover:text-white">Technology</span>
            <span className="hover:text-white">Support</span>
          </nav>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-2 lg:items-start">
        <div className="space-y-6">
          <span className="inline-flex items-center rounded-full border border-slate-800 px-4 py-1 text-xs uppercase tracking-[0.3em] text-slate-300">
            Premium audio
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {PRODUCT_NAME}
          </h1>
          <p className="text-lg leading-relaxed text-slate-300">
            Immerse yourself in studio-quality sound with hybrid noise cancellation, crystal clear calls, and a comfortable fit designed for all-day listening.
          </p>

          <ul className="grid gap-4 text-sm text-slate-300 sm:grid-cols-2">
            <li className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">20-hour battery life</li>
            <li className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">Bluetooth 5.3 connectivity</li>
            <li className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">Adaptive noise cancellation</li>
            <li className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">Low-latency gaming mode</li>
          </ul>
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/50 shadow-xl">
            <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-8">
              <div className="aspect-square w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                <img
                  src="https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?auto=format&fit=crop&w=900&q=80"
                  alt="Premium Wireless Headphones"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-6 space-y-2">
                <h2 className="text-2xl font-semibold text-white">Aurora Pro Wireless</h2>
                <p className="text-sm text-slate-300">
                  Includes travel case, USB-C fast charging cable, and multi-device pairing.
                </p>
              </div>
            </div>
            <div className="border-t border-slate-800 bg-slate-900/80 p-8">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Price</div>
                  <div className="text-3xl font-semibold text-white">{formatCurrency(PRODUCT_AMOUNT)}</div>
                </div>
                <div className="text-right text-xs text-slate-400">Shipping calculated at checkout</div>
              </div>
              <div className="mt-6">
                <Elements stripe={stripePromise}>
                  <CheckoutForm />
                </Elements>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/60 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Aurora Audio. All rights reserved.
      </footer>
    </div>
  );
}

export default ProductPage;
