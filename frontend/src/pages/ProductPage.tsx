import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const PRODUCT_AMOUNT = 9999;
const PRODUCT_NAME = 'Premium Wireless Headphones';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount / 100);

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

interface CheckoutFormProps {
  orderId: string;
  onClose: () => void;
}

function CheckoutForm({ orderId, onClose }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Payment form is still loading. Please wait and try again.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message ?? 'Unable to validate your payment details.');
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (confirmError) {
        throw new Error(confirmError.message ?? 'Payment failed. Please try again.');
      }

      if (!paymentIntent) {
        throw new Error('Missing payment confirmation.');
      }

      if (paymentIntent.status !== 'succeeded') {
        throw new Error(`Payment status: ${paymentIntent.status}`);
      }

      const recordResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          paymentIntentId: paymentIntent.id,
          productName: PRODUCT_NAME,
          amount: PRODUCT_AMOUNT,
          status: 'PAID',
        }),
      });

      if (!recordResponse.ok) {
        throw new Error('Unable to record your order. Please contact support.');
      }

      navigate(`/success?orderId=${orderId}&payment_intent=${paymentIntent.id}`);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Unexpected error occurred.';
      navigate(`/error?orderId=${orderId}&message=${encodeURIComponent(message)}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Payment details</div>
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <PaymentElement
            options={{
              layout: 'tabs',
            }}
          />
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Use the Stripe test card <span className="font-semibold text-white">4242 4242 4242 4242</span> with any future
          expiration date and CVC 123.
        </p>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={processing}
          className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-indigo-500/60"
        >
          {processing ? 'Processing…' : 'Pay Now'}
        </button>
      </div>
    </form>
  );
}

interface CheckoutModalProps {
  clientSecret: string;
  orderId: string;
  onClose: () => void;
}

function CheckoutModal({ clientSecret, orderId, onClose }: CheckoutModalProps) {
  if (!stripePromise) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 transition hover:text-white"
          aria-label="Close checkout"
        >
          ✕
        </button>
        <h2 className="text-lg font-semibold text-white">Complete your purchase</h2>
        <p className="mt-1 text-sm text-slate-300">Enter your payment details to finalize the order.</p>
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>{PRODUCT_NAME}</span>
            <span className="font-semibold text-white">{formatCurrency(PRODUCT_AMOUNT)}</span>
          </div>
        </div>
        <div className="mt-6">
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm orderId={orderId} onClose={onClose} />
          </Elements>
        </div>
      </div>
    </div>
  );
}

function ProductPage() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [requestingIntent, setRequestingIntent] = useState(false);
  const [intentError, setIntentError] = useState<string | null>(null);

  const startCheckout = async () => {
    if (!publishableKey || !stripePromise) {
      setIntentError('Stripe is not configured.');
      return;
    }

    if (clientSecret && orderId) {
      setShowCheckout(true);
      return;
    }

    setRequestingIntent(true);
    setIntentError(null);

    try {
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Unable to start checkout. Please try again.');
      }

      const data: { clientSecret: string; orderId: string } = await response.json();
      setClientSecret(data.clientSecret);
      setOrderId(data.orderId);
      setShowCheckout(true);
    } catch (err) {
      console.error(err);
      setIntentError(err instanceof Error ? err.message : 'Unexpected error occurred.');
    } finally {
      setRequestingIntent(false);
    }
  };

  if (!publishableKey || !stripePromise) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center text-white">
        <div className="max-w-md space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-8">
          <h1 className="text-2xl font-semibold">Stripe not configured</h1>
          <p className="text-sm text-slate-300">
            Set <span className="font-mono text-xs">VITE_STRIPE_PUBLISHABLE_KEY</span> in the frontend environment before running
            the store.
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
            Immerse yourself in studio-quality sound with hybrid noise cancellation, crystal clear calls, and a comfortable fit
            designed for all-day listening.
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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Price</div>
                  <div className="text-3xl font-semibold text-white">{formatCurrency(PRODUCT_AMOUNT)}</div>
                </div>
                <div className="text-xs text-slate-400 sm:text-right">Shipping calculated at checkout</div>
              </div>
              <div className="mt-8 space-y-4">
                <button
                  type="button"
                  onClick={startCheckout}
                  disabled={requestingIntent}
                  className="inline-flex w-full items-center justify-center rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-indigo-500/60"
                >
                  {requestingIntent ? 'Preparing checkout…' : 'Buy Now'}
                </button>
                {intentError && <p className="text-sm text-red-400">{intentError}</p>}
                <p className="text-xs text-slate-400">
                  Secure payments are powered by Stripe and processed directly on this page.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/60 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Aurora Audio. All rights reserved.
      </footer>

      {showCheckout && clientSecret && orderId && (
        <CheckoutModal
          clientSecret={clientSecret}
          orderId={orderId}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </div>
  );
}

export default ProductPage;
