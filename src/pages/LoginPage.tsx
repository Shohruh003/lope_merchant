import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../lib/auth-context';

/// Sign-in for the merchant panel. Uses the existing backend
/// /auth/login endpoint (phone + password). The panel is
/// admin-only, so the auth-context throws if the JWT doesn't
/// carry role='admin' — see auth-context.login().
///
/// Design intentionally minimal: this is not a customer-facing
/// screen, just a way for Shohruh (and later an accountant with
/// admin rights) to get into the finance dashboard.
export default function LoginPage() {
  const { user, login, loading, error } = useAuth();
  const location = useLocation();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  if (user) {
    // Already logged in — bounce to whatever they were going to
    // (or /overview if they hit /login directly).
    const from =
      (location.state as { from?: string } | undefined)?.from ??
      '/overview';
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure phone starts with +998 — the backend regex demands it.
    const normalisedPhone = phone.startsWith('+')
      ? phone
      : phone.startsWith('998')
        ? `+${phone}`
        : `+998${phone.replace(/\D/g, '')}`;
    try {
      await login(normalisedPhone, password);
    } catch {
      /* handled via error state */
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm"
      >
        <div className="mb-6">
          <div className="text-xl font-bold tracking-tight text-brand">
            LOPE Merchant
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            Moliya paneliga kirish
          </p>
        </div>

        <label className="mb-3 flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">
            Telefon raqam
          </span>
          <input
            required
            type="tel"
            autoComplete="username"
            placeholder="+998 90 123 45 67"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-md border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </label>

        <label className="mb-4 flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Parol</span>
          <input
            required
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </label>

        {error && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Kirilyapti..." : 'Kirish'}
        </button>
      </form>
    </div>
  );
}
