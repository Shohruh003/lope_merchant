import { NavLink, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

import { api, type DashboardProduct } from '../lib/api';
import { useProduct } from '../lib/product-context';

/// Persistent top-nav shell that wraps every dashboard page. Left
/// side: LOPE logo + section tabs. Right side: product filter chip
/// picker so the merchant can scope the whole panel to a single
/// Lope product (or "Barchasi" to see everything).
export function AppShell({ children }: { children: ReactNode }) {
  const { active, setActive } = useProduct();
  const location = useLocation();

  const productsQuery = useQuery({
    queryKey: ['dashboard', 'products'],
    queryFn: () => api.products(),
    staleTime: 5 * 60_000, // catalogue barely changes
  });
  const products = (productsQuery.data ?? []).filter((p) => p.active);

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-8 px-6 py-4">
          <div className="text-lg font-bold tracking-tight text-brand">
            LOPE Merchant
          </div>
          <nav className="flex gap-1">
            <NavItem to="/overview" label="Umumiy" />
            <NavItem to="/payments" label="To'lovlar" />
            <NavItem to="/reconciliation" label="Sverka" />
            <NavItem to="/fiscal" label="OFD" />
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <ProductPicker
              products={products}
              active={active}
              onChange={setActive}
            />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Reroute key so a product filter change forces a clean
            re-render of the page — TanStack Query's queryKey already
            handles data, this handles component state (form inputs,
            selection, scroll). */}
        <div key={`${location.pathname}-${active}`}>{children}</div>
      </main>
    </div>
  );
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-brand text-white'
            : 'text-neutral-700 hover:bg-neutral-100'
        }`
      }
    >
      {label}
    </NavLink>
  );
}

function ProductPicker({
  products,
  active,
  onChange,
}: {
  products: DashboardProduct[];
  active: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-full bg-neutral-100 p-1">
      <PickerChip
        active={active === 'all'}
        onClick={() => onChange('all')}
      >
        Barchasi
      </PickerChip>
      {products.map((p) => (
        <PickerChip
          key={p.slug}
          active={active === p.slug}
          onClick={() => onChange(p.slug)}
          accent={p.accentHex}
        >
          {p.displayName}
        </PickerChip>
      ))}
    </div>
  );
}

function PickerChip({
  children,
  active,
  accent,
  onClick,
}: {
  children: ReactNode;
  active: boolean;
  accent?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
        active
          ? 'bg-white shadow-sm ring-1 ring-neutral-200'
          : 'text-neutral-600 hover:text-neutral-900'
      }`}
      style={active && accent ? { color: accent } : undefined}
    >
      {children}
    </button>
  );
}
