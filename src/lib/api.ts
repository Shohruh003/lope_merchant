/// Thin fetch wrapper — every call goes through here so auth + error
/// handling stay in one place. Runs against VITE_API_URL (set in
/// Netlify env), attaches the JWT stored in localStorage under
/// `lope_merchant.jwt`, and throws a typed error on non-2xx so
/// TanStack Query can retry-or-toast per its own defaults.

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

const JWT_KEY = 'lope_merchant.jwt';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
  }
}

export function getToken(): string | null {
  try {
    return window.localStorage.getItem(JWT_KEY);
  } catch {
    return null;
  }
}

export function setToken(v: string | null): void {
  try {
    if (v === null) {
      window.localStorage.removeItem(JWT_KEY);
    } else {
      window.localStorage.setItem(JWT_KEY, v);
    }
  } catch {
    // Storage disabled (Safari private mode etc.) — the session
    // won't persist across reloads but the current tab still works.
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (init.body && !(init.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });
  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      /* ignore */
    }
    // 401 → the token we've been sending has expired or been
    // revoked. Wipe local storage and let the next navigation
    // bounce to /login through RequireAuth. Doing this here means
    // every hook (TanStack Query, direct fetch, whatever) reacts
    // consistently.
    if (res.status === 401) {
      setToken(null);
      try {
        window.localStorage.removeItem('lope_merchant.user');
      } catch {
        /* ignore */
      }
    }
    const msg =
      (body as { message?: string } | null)?.message ??
      res.statusText ??
      `HTTP ${res.status}`;
    throw new ApiError(String(msg), res.status, body);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ─── typed endpoints ─────────────────────────────────────────────

export interface DashboardProduct {
  slug: string;
  displayName: string;
  accentHex: string;
  active: boolean;
}

export interface DashboardOverview {
  totalPaidSom: number;
  countPaid: number;
  countPending: number;
  countCancelled: number;
  countRefunded: number;
  countFailed: number;
  channels: {
    payme: { totalSom: number; count: number };
    click: { totalSom: number; count: number };
  };
  products: Array<{
    slug: string;
    displayName: string;
    totalSom: number;
    count: number;
  }>;
  hourly: Array<{ hour: string; totalSom: number; count: number }>;
}

export type PaymentStatus =
  | 'paid'
  | 'pending'
  | 'prepared'
  | 'cancelled'
  | 'refunded'
  | 'failed';

export interface DashboardPayment {
  id: string;
  orderId: string;
  channel: 'payme' | 'click';
  source: 'payhelp-legacy' | 'lope-direct';
  productSlug: string;
  amountSom: number;
  status: PaymentStatus;
  createdAt: string;
  performedAt: string | null;
  cancelledAt: string | null;
  userId: string;
  userName: string;
  userPhone: string;
}

export interface DashboardPaymentsPage {
  items: DashboardPayment[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface RangeQuery {
  from?: string;
  to?: string;
  product?: string;
  channel?: 'payme' | 'click';
}

/// Build a URL query string, skipping undefined and empty values.
function q(params: Record<string, string | number | undefined>): string {
  const out = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') out.set(k, String(v));
  }
  const s = out.toString();
  return s ? `?${s}` : '';
}

export const api = {
  products: () =>
    request<DashboardProduct[]>('/gateway/dashboard/products'),
  overview: (input: RangeQuery) =>
    request<DashboardOverview>(
      `/gateway/dashboard/overview${q({
        from: input.from,
        to: input.to,
        product: input.product,
        channel: input.channel,
      })}`,
    ),
  payments: (
    input: RangeQuery & {
      status?: PaymentStatus;
      page?: number;
      pageSize?: number;
    },
  ) =>
    request<DashboardPaymentsPage>(
      `/gateway/dashboard/payments${q({
        from: input.from,
        to: input.to,
        product: input.product,
        channel: input.channel,
        status: input.status,
        page: input.page,
        pageSize: input.pageSize,
      })}`,
    ),
  /// Returns the full absolute CSV URL so the caller can put it in
  /// an `<a href="...">` — a fetch-then-blob would fight the browser's
  /// download UI.
  exportCsvUrl: (input: RangeQuery): string => {
    const url = `${API_URL}/gateway/dashboard/export.csv${q({
      from: input.from,
      to: input.to,
      product: input.product,
      channel: input.channel,
    })}`;
    return url;
  },
  login: (phone: string, password: string) =>
    request<{ token: string; refreshToken: string; user: { role: string } }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ phone, password }),
      },
    ),
};
