import { Routes, Route, Navigate } from 'react-router-dom';

import { AppShell } from './components/AppShell';
import { RequireAuth } from './components/RequireAuth';
import { AuthProvider } from './lib/auth-context';
import { ProductProvider } from './lib/product-context';
import LoginPage from './pages/LoginPage';
import OverviewPage from './pages/OverviewPage';
import PaymentsPage from './pages/PaymentsPage';

/// Root of the LOPE MCHJ merchant dashboard.
///
/// Provider order matters — AuthProvider must wrap ProductProvider
/// so a logout can clear both without racing the product context's
/// localStorage listener.
///
/// Route layout:
///   /login              — public
///   everything else     — behind <RequireAuth> which bounces
///                         anonymous callers to /login, preserving
///                         the intended destination via
///                         location.state.from.
export default function App() {
  return (
    <AuthProvider>
      <ProductProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route
            path="/overview"
            element={
              <RequireAuth>
                <AppShell>
                  <OverviewPage />
                </AppShell>
              </RequireAuth>
            }
          />
          <Route
            path="/payments"
            element={
              <RequireAuth>
                <AppShell>
                  <PaymentsPage />
                </AppShell>
              </RequireAuth>
            }
          />
          <Route
            path="/reconciliation"
            element={
              <RequireAuth>
                <AppShell>
                  <ComingSoon title="Sverka" />
                </AppShell>
              </RequireAuth>
            }
          />
          <Route
            path="/fiscal"
            element={
              <RequireAuth>
                <AppShell>
                  <ComingSoon title="OFD cheklar" />
                </AppShell>
              </RequireAuth>
            }
          />
          <Route
            path="*"
            element={
              <RequireAuth>
                <AppShell>
                  <ComingSoon title="Sahifa topilmadi" />
                </AppShell>
              </RequireAuth>
            }
          />
        </Routes>
      </ProductProvider>
    </AuthProvider>
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
