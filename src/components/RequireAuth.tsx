import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

import { useAuth } from '../lib/auth-context';

/// Route guard — any child route that renders finance data must be
/// wrapped in this so anonymous requests are bounced to /login. The
/// original destination is remembered via `location.state` so the
/// login page can send them back after they authenticate.
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }
  return <>{children}</>;
}
