import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { api, type PaymentStatus } from '../lib/api';
import { formatSom, formatTime } from '../lib/format';
import { useProduct } from '../lib/product-context';

const STATUS_LABEL: Record<PaymentStatus, string> = {
  paid: "To'landi",
  pending: 'Kutilmoqda',
  prepared: 'Reservatsiya',
  cancelled: 'Bekor qilingan',
  refunded: 'Qaytarilgan',
  failed: 'Xato',
};

const STATUS_STYLE: Record<PaymentStatus, string> = {
  paid: 'bg-emerald-100 text-emerald-800',
  pending: 'bg-neutral-100 text-neutral-700',
  prepared: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-neutral-200 text-neutral-600',
  refunded: 'bg-amber-100 text-amber-800',
  failed: 'bg-red-100 text-red-800',
};

/// Default range = last 7 days (a bit wider than Overview since
/// people browse the transaction table looking for specific rows).
function last7d(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: now.toISOString() };
}

export default function PaymentsPage() {
  const { active } = useProduct();
  const [range, setRange] = useState(last7d);
  const [channel, setChannel] = useState<'payme' | 'click' | ''>('');
  const [status, setStatus] = useState<PaymentStatus | ''>('');
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const payments = useQuery({
    queryKey: ['payments', range, active, channel, status, page],
    queryFn: () =>
      api.payments({
        from: range.from,
        to: range.to,
        product: active === 'all' ? undefined : active,
        channel: channel || undefined,
        status: status || undefined,
        page,
        pageSize,
      }),
    placeholderData: (previous) => previous, // keep prev while paging
  });

  const csvHref = useMemo(
    () =>
      api.exportCsvUrl({
        from: range.from,
        to: range.to,
        product: active === 'all' ? undefined : active,
        channel: channel || undefined,
      }),
    [range, active, channel],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">To'lovlar</h1>
        <a
          href={csvHref}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          CSV yuklab olish
        </a>
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <FilterField label="Dan (sana)">
            <input
              type="date"
              className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
              value={toDateInput(range.from)}
              onChange={(e) =>
                setRange({ ...range, from: fromDateInput(e.target.value) })
              }
            />
          </FilterField>
          <FilterField label="Gacha">
            <input
              type="date"
              className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
              value={toDateInput(range.to)}
              onChange={(e) =>
                setRange({ ...range, to: fromDateInput(e.target.value) })
              }
            />
          </FilterField>
          <FilterField label="Kanal">
            <select
              value={channel}
              className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
              onChange={(e) => {
                setPage(1);
                setChannel(e.target.value as 'payme' | 'click' | '');
              }}
            >
              <option value="">Barchasi</option>
              <option value="payme">Payme</option>
              <option value="click">Click</option>
            </select>
          </FilterField>
          <FilterField label="Holat">
            <select
              value={status}
              className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value as PaymentStatus | '');
              }}
            >
              <option value="">Barchasi</option>
              {(
                [
                  'paid',
                  'prepared',
                  'pending',
                  'cancelled',
                  'refunded',
                  'failed',
                ] as PaymentStatus[]
              ).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </FilterField>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Vaqt</th>
              <th className="px-4 py-3 font-medium">Kanal</th>
              <th className="px-4 py-3 font-medium">Mahsulot</th>
              <th className="px-4 py-3 font-medium">Foydalanuvchi</th>
              <th className="px-4 py-3 text-right font-medium">Summa</th>
              <th className="px-4 py-3 font-medium">Holat</th>
              <th className="px-4 py-3 font-medium">Manba</th>
            </tr>
          </thead>
          <tbody>
            {(payments.data?.items ?? []).map((p) => (
              <tr
                key={`${p.source}-${p.id}`}
                className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
              >
                <td className="px-4 py-2 tabular-nums text-neutral-600">
                  {formatTime(p.createdAt)}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-semibold ${
                      p.channel === 'payme'
                        ? 'bg-violet-100 text-violet-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {p.channel === 'payme' ? 'Payme' : 'Click'}
                  </span>
                </td>
                <td className="px-4 py-2 text-neutral-600">
                  {p.productSlug}
                </td>
                <td className="px-4 py-2">
                  <div className="font-medium">{p.userName}</div>
                  <div className="text-xs text-neutral-500">
                    {p.userPhone}
                  </div>
                </td>
                <td className="px-4 py-2 text-right font-medium tabular-nums">
                  {formatSom(p.amountSom)}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[p.status]}`}
                  >
                    {STATUS_LABEL[p.status]}
                  </span>
                </td>
                <td className="px-4 py-2 text-xs text-neutral-500">
                  {p.source === 'payhelp-legacy' ? 'Payhelp' : 'Direct'}
                </td>
              </tr>
            ))}
            {payments.data && payments.data.items.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-16 text-center text-sm text-neutral-500"
                >
                  Bu filter uchun to'lov topilmadi
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {payments.data && payments.data.totalCount > pageSize && (
        <div className="flex items-center justify-between text-sm">
          <div className="text-neutral-500">
            {payments.data.totalCount} tadan{' '}
            {(payments.data.page - 1) * payments.data.pageSize + 1}-
            {Math.min(
              payments.data.page * payments.data.pageSize,
              payments.data.totalCount,
            )}
          </div>
          <div className="flex gap-1">
            <PageBtn
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Oldingi
            </PageBtn>
            <PageBtn
              disabled={
                page * pageSize >= payments.data.totalCount
              }
              onClick={() => setPage((p) => p + 1)}
            >
              Keyingi
            </PageBtn>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-neutral-500">
      {label}
      {children}
    </label>
  );
}

function PageBtn({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
    >
      {children}
    </button>
  );
}

/// ISO string → YYYY-MM-DD for the <input type="date">.
function toDateInput(iso: string): string {
  return iso.slice(0, 10);
}
function fromDateInput(v: string): string {
  return `${v}T00:00:00.000Z`;
}
