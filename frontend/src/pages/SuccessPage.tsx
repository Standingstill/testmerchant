import { useEffect, useMemo, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';

interface Order {
  id: string;
  productName: string;
  amount: number;
  stripePaymentIntentId: string | null;
  status: 'PENDING' | 'PAID' | 'FAILED';
  createdAt: string;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount / 100);

function SuccessPage() {
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const orderId = params.get('orderId');
  const paymentIntentId = params.get('payment_intent');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const fetchOrder = async () => {
      if (!orderId) {
        setError('We could not find your order information.');
        setLoading(false);
        return;
      }

      try {
        for (let attempt = 0; attempt < 5; attempt += 1) {
          const response = await fetch('/api/orders');
          if (!response.ok) {
            throw new Error('Unable to load order details.');
          }

          const orders: Order[] = await response.json();
          const foundOrder = orders.find((item) => item.id === orderId);
          if (foundOrder) {
            if (isActive) {
              setOrder(foundOrder);
              setLoading(false);
            }
            return;
          }

          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
        if (isActive) {
          setLoading(false);
          setError('Payment is processing. Refresh this page in a moment.');
        }
      } catch (err) {
        console.error(err);
        if (isActive) {
          setError(err instanceof Error ? err.message : 'Unexpected error occurred.');
          setLoading(false);
        }
      }
    };

    fetchOrder();

    return () => {
      isActive = false;
    };
  }, [orderId]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-10 inline-flex rounded-full border border-emerald-500/50 bg-emerald-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-emerald-300">
          Success
        </div>
        <h1 className="text-4xl font-semibold sm:text-5xl">Thank you for your purchase!</h1>
        <p className="mt-4 max-w-xl text-sm text-slate-300 sm:text-base">
          Your order has been received and we&apos;re preparing it for shipment. A receipt has been sent to your email from
          Stripe.
        </p>

        <div className="mt-12 w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900/60 p-8 text-left shadow-lg">
          <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Order summary</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <div className="flex items-center justify-between">
              <span>Order ID</span>
              <span className="font-mono text-xs text-slate-200">{orderId ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Payment intent</span>
              <span className="font-mono text-xs text-slate-200">{paymentIntentId ?? order?.stripePaymentIntentId ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Product</span>
              <span className="font-medium text-slate-100">{order?.productName ?? 'Premium Wireless Headphones'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Amount</span>
              <span className="font-medium text-slate-100">
                {order ? formatCurrency(order.amount) : formatCurrency(9999)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Status</span>
              <span className="font-semibold text-emerald-300">{order?.status ?? 'PENDING'}</span>
            </div>
          </div>

          {loading && <p className="mt-6 text-sm text-slate-400">Finalizing payment details…</p>}
          {error && <p className="mt-6 text-sm text-amber-300">{error}</p>}
        </div>

        <Link
          to="/"
          className="mt-12 inline-flex items-center rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
        >
          Back to store
        </Link>
      </div>
    </div>
  );
}

export default SuccessPage;
