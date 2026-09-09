import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

/// The product filter the whole dashboard is scoped to. `'all'` means
/// "show every Lope product in one combined view"; any other value is
/// a productSlug straight from the backend catalogue
/// (`GET /gateway/dashboard/products`).
///
/// Adding a new product later (Lope Store, Lope Pay ...) does NOT
/// require code changes here — the switcher populates itself from the
/// backend catalogue on load.
export type ProductFilter = 'all' | string;

interface ProductCtx {
  active: ProductFilter;
  setActive: (v: ProductFilter) => void;
}

const Ctx = createContext<ProductCtx | null>(null);

export function ProductProvider({ children }: { children: ReactNode }) {
  // Persist the last-selected product across page reloads so the
  // accountant doesn't have to re-select "Lope Store" every morning.
  const initial = (typeof window !== 'undefined'
    ? window.localStorage.getItem('lope_merchant.product')
    : null) as ProductFilter | null;
  const [active, setActiveState] = useState<ProductFilter>(initial ?? 'all');

  const value = useMemo<ProductCtx>(
    () => ({
      active,
      setActive: (v) => {
        setActiveState(v);
        try {
          window.localStorage.setItem('lope_merchant.product', v);
        } catch {
          // Safari private mode / disabled storage — persistence is a
          // nice-to-have, don't block.
        }
      },
    }),
    [active],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/// Read the currently selected product filter. Throws if called outside
/// [ProductProvider] — that's a wiring bug, not a runtime edge case.
export function useProduct(): ProductCtx {
  const v = useContext(Ctx);
  if (!v) {
    throw new Error('useProduct must be inside ProductProvider');
  }
  return v;
}
