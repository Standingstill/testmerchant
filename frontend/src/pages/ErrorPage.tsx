import { Link, useLocation } from 'react-router-dom';

function ErrorPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const orderId = params.get('orderId');
  const message = params.get('message');

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-10 inline-flex rounded-full border border-red-500/50 bg-red-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-red-300">
          Payment issue
        </div>
        <h1 className="text-4xl font-semibold sm:text-5xl">Your payment could not be completed</h1>
        <p className="mt-4 max-w-xl text-sm text-slate-300 sm:text-base">
          No charges were made to your card. Review the details below and try submitting your payment again.
        </p>

        <div className="mt-12 w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900/60 p-8 text-left shadow-lg">
          <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Order reference</h2>
          <p className="mt-4 font-mono text-xs text-slate-200">{orderId ?? 'No order created'}</p>
          {message && <p className="mt-4 text-sm text-red-300">{message}</p>}
          <p className="mt-4 text-sm text-slate-400">
            Stripe test card: <span className="font-semibold text-white">4242 4242 4242 4242</span>, any future expiry, CVC 123.
          </p>
        </div>

        <Link
          to="/"
          className="mt-12 inline-flex items-center rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
        >
          Retry payment
        </Link>
      </div>
    </div>
  );
}

export default ErrorPage;
