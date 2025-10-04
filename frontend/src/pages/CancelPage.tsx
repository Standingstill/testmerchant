import { Link, useLocation } from 'react-router-dom';

function CancelPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const orderId = params.get('orderId');

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-10 inline-flex rounded-full border border-red-500/50 bg-red-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-red-300">
          Payment canceled
        </div>
        <h1 className="text-4xl font-semibold sm:text-5xl">Your payment was canceled</h1>
        <p className="mt-4 max-w-xl text-sm text-slate-300 sm:text-base">
          No charges were made to your card. You can retry checkout at any time.
        </p>

        <div className="mt-12 w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900/60 p-8 text-left shadow-lg">
          <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Order reference</h2>
          <p className="mt-4 font-mono text-xs text-slate-200">{orderId ?? 'No order created'}</p>
          <p className="mt-4 text-sm text-slate-400">
            If the issue persists, please use the Stripe test card <span className="font-semibold text-white">4242 4242 4242 4242</span> with any
            future expiry date and CVC 123.
          </p>
        </div>

        <Link
          to="/"
          className="mt-12 inline-flex items-center rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
        >
          Return to store
        </Link>
      </div>
    </div>
  );
}

export default CancelPage;
