import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';

import { api, getToken, setToken } from './api';

/// Auth is intentionally narrow: we only care about whether we HAVE
/// a token (session exists) and what the current user's role is
/// (must be `admin` to see finance data — see backend
/// gateway/dashboard.controller). No profile, no avatar, no
/// preferences — the merchant panel doesn't need any of that.

export interface AuthUser {
  role: string;
}

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

const USER_KEY = 'lope_merchant.user';

function readCachedUser(): AuthUser | null {
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function writeCachedUser(u: AuthUser | null): void {
  try {
    if (u === null) window.localStorage.removeItem(USER_KEY);
    else window.localStorage.setItem(USER_KEY, JSON.stringify(u));
  } catch {
    /* storage disabled — session stays in memory only */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Seed from cache so a page reload doesn't bounce the merchant
  // back to /login for the ~50ms before we validate the token.
  const [user, setUser] = useState<AuthUser | null>(() => {
    return getToken() ? readCachedUser() : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // React to storage changes from other tabs — if the merchant
  // signs out in another tab, drop the session here too.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'lope_merchant.jwt' && e.newValue === null) {
        setUser(null);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const login = useCallback(async (phone: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(phone, password);
      if (res.user.role !== 'admin') {
        // Finance data is admin-only per gateway/dashboard.controller.
        // A non-admin login would succeed at the auth layer but every
        // subsequent dashboard call would 403 — better to reject
        // upfront with a clear message.
        throw new Error(
          "Bu panelga kirish uchun admin huquqi kerak",
        );
      }
      setToken(res.token);
      const u: AuthUser = { role: res.user.role };
      writeCachedUser(u);
      setUser(u);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'Kirishda xato';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    writeCachedUser(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({ user, loading, error, login, logout }),
    [user, loading, error, login, logout],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be inside AuthProvider');
  return v;
}
