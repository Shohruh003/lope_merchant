import { Routes, Route, Navigate } from 'react-router-dom';

import { AppShell } from './components/AppShell';
import { ProductProvider } from './lib/product-context';
import OverviewPage from './pages/OverviewPage';
import PaymentsPage from './pages/PaymentsPage';

/// Root of the LOPE MCHJ merchant dashboard.
///
/// Every route lives inside [AppShell] so the top-nav + product
/// picker + auth guard stay put across navigation.
///
/// Auth: TODO — the current build assumes a JWT already lives in
/// `lope_merchant.jwt` localStorage. A dedicated `/login` route that
/// signs an admin user in will land in the next slice.
export default function App() {
  return (
    <ProductProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route
          path="/overview"
          element={
            <AppShell>
              <OverviewPage />
            </AppShell>
          }
        />
        <Route
          path="/payments"
          element={
            <AppShell>
              <PaymentsPage />
            </AppShell>
          }
        />
        <Route
          path="/reconciliation"
          element={
            <AppShell>
              <ComingSoon title="Sverka" />
            </AppShell>
          }
        />
        <Route
          path="/fiscal"
          element={
            <AppShell>
              <ComingSoon title="OFD cheklar" />
            </AppShell>
          }
        />
        <Route
          path="*"
          element={
            <AppShell>
              <ComingSoon title="Sahifa topilmadi" />
            </AppShell>
          }
        />
      </Routes>
    </ProductProvider>
  );
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-16 text-center">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Bu sahifa keyingi versiyada tayyor bo'ladi.
      </p>
    </div>
  );
}
