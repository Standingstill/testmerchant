import { useState } from 'react';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount / 100);

function ProductPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Unable to start checkout. Please try again.');
      }

      const data: { url: string } = await response.json();
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Unexpected error occurred.');
      setLoading(false);
    }
  };

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

      <main className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <span className="inline-flex items-center rounded-full border border-slate-800 px-4 py-1 text-xs uppercase tracking-[0.3em] text-slate-300">
            Premium audio
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Premium Wireless Headphones
          </h1>
          <p className="text-lg leading-relaxed text-slate-300">
            Immerse yourself in studio-quality sound with hybrid noise cancellation, crystal clear calls, and a
            comfortable fit designed for all-day listening.
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
                  <div className="text-3xl font-semibold text-white">{formatCurrency(9999)}</div>
                </div>
                <div className="text-right text-xs text-slate-400">Shipping calculated at checkout</div>
              </div>
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-indigo-500/60"
              >
                {loading ? 'Redirecting…' : 'Buy Now'}
              </button>
              {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
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
