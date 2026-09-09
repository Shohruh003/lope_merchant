import { Routes, Route, Navigate } from 'react-router-dom';

import { ProductProvider } from './lib/product-context';

/// Root of the LOPE MCHJ merchant dashboard. Layout + routing only —
/// each page-level view lives in `./pages`.
///
/// Routes shipped in the first cut:
///   /                       → redirect to /overview
///   /overview               → today totals + real-time feed
///   /payments               → paginated transaction table with filters
///   /reconciliation         → DB vs Payme/Click cabinet drift view
///   /fiscal                 → OFD chek status per payment
///   /export                 → CSV / Excel download
///   /login                  → JWT sign-in (merchant role gate)
///
/// Every page reads the currently selected product from
/// [ProductProvider] — the top-nav switcher scopes every view to
/// Lope Style / Lope Store / Lope Pay / ... / All. New products
/// appear automatically once the backend lists them in
/// `GET /gateway/dashboard/products`.
///
/// Pages are stubs until the backend endpoints exist. Building the
/// shell first so we can wire real data in without shuffling layout.
export default function App() {
  return (
    <ProductProvider>
      <div className="min-h-screen bg-neutral-50 text-neutral-900">
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route
            path="/overview"
            element={<PlaceholderPage title="Umumiy" />}
          />
          <Route
            path="/payments"
            element={<PlaceholderPage title="To'lovlar" />}
          />
          <Route
            path="/reconciliation"
            element={<PlaceholderPage title="Sverka" />}
          />
          <Route
            path="/fiscal"
            element={<PlaceholderPage title="OFD cheklar" />}
          />
          <Route
            path="/export"
            element={<PlaceholderPage title="Eksport" />}
          />
          <Route path="/login" element={<PlaceholderPage title="Kirish" />} />
          <Route
            path="*"
            element={<PlaceholderPage title="Sahifa topilmadi" />}
          />
        </Routes>
      </div>
    </ProductProvider>
  );
}

/// Temporary until each real page lands. Renders the route title so
/// we can visually confirm routing works while the backend is being
/// built out.
function PlaceholderPage({ title }: { title: string }) {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-neutral-500">
        LOPE MCHJ merchant paneli. Bu sahifa hali yaratilmagan.
      </p>
    </main>
  );
}
