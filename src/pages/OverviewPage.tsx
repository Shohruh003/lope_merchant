import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { api } from '../lib/api';
import { formatShortSom, formatSom, formatHourLabel } from '../lib/format';
import { useProduct } from '../lib/product-context';

/// Default range on load = last 24 h. A calendar / preset switcher
/// lands with the Payments page — this view is deliberately
/// zero-config so the merchant can walk in and see today.
function last24h(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: now.toISOString() };
}

export default function OverviewPage() {
  const { active } = useProduct();
  const range = useMemo(() => last24h(), []);

  const overview = useQuery({
    queryKey: ['overview', range, active],
    queryFn: () =>
      api.overview({
        from: range.from,
        to: range.to,
        product: active === 'all' ? undefined : active,
      }),
    refetchInterval: 15_000, // near-real-time feel
  });

  if (overview.isLoading && !overview.data) {
    return <SkeletonBlock />;
  }
  if (overview.error && !overview.data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Ma'lumot yuklanmadi: {String((overview.error as Error).message)}
      </div>
    );
  }
  const d = overview.data;
  if (!d) return null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Umumiy holat</h1>
        <span className="text-sm text-neutral-500">
          So'nggi 24 soat &middot; {active === 'all' ? 'Barcha mahsulotlar' : active}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          label="Tushgan pul"
          value={formatSom(d.totalPaidSom)}
          hint={`${d.countPaid} ta muvaffaqiyatli to'lov`}
          accent="text-emerald-600"
        />
        <KpiCard
          label="Kutilmoqda"
          value={String(d.countPending)}
          hint="Boshlangan lekin yakunlanmagan"
        />
        <KpiCard
          label="Bekor qilingan"
          value={String(d.countCancelled + d.countFailed)}
          hint={`${d.countCancelled} bekor + ${d.countFailed} xato`}
          accent="text-neutral-500"
        />
        <KpiCard
          label="Qaytarilgan"
          value={String(d.countRefunded)}
          hint="Muvaffaqiyatli, keyin qaytarilgan"
          accent="text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="col-span-2 rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-neutral-700">
            Soat bo'yicha tushum
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={d.hourly.map((h) => ({
                  ...h,
                  label: formatHourLabel(h.hour),
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={(v: number) => formatShortSom(v)}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: number) => [
                    formatSom(value),
                    "So'm",
                  ]}
                />
                <Bar dataKey="totalSom" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-neutral-700">
            Kanal bo'yicha
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    {
                      name: 'Payme',
                      value: d.channels.payme.totalSom,
                    },
                    {
                      name: 'Click',
                      value: d.channels.click.totalSom,
                    },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  <Cell fill="#7c3aed" />
                  <Cell fill="#059669" />
                </Pie>
                <Legend />
                <Tooltip
                  formatter={(value: number) => [
                    formatSom(value),
                    "So'm",
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="font-semibold text-brand">Payme</div>
              <div className="text-neutral-500">
                {formatShortSom(d.channels.payme.totalSom)} &middot;{' '}
                {d.channels.payme.count} ta
              </div>
            </div>
            <div>
              <div className="font-semibold text-emerald-600">Click</div>
              <div className="text-neutral-500">
                {formatShortSom(d.channels.click.totalSom)} &middot;{' '}
                {d.channels.click.count} ta
              </div>
            </div>
          </div>
        </section>
      </div>

      {d.products.length > 0 && (
        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-neutral-700">
            Mahsulot bo'yicha
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="pb-2 font-medium">Mahsulot</th>
                <th className="pb-2 text-right font-medium">Summa</th>
                <th className="pb-2 text-right font-medium">Soni</th>
              </tr>
            </thead>
            <tbody>
              {d.products.map((p) => (
                <tr key={p.slug} className="border-b border-neutral-100 last:border-0">
                  <td className="py-2 font-medium">{p.displayName}</td>
                  <td className="py-2 text-right">
                    {formatSom(p.totalSom)}
                  </td>
                  <td className="py-2 text-right text-neutral-500">
                    {p.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  accent = 'text-neutral-900',
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5">
      <div className="text-xs uppercase tracking-wide text-neutral-500">
        {label}
      </div>
      <div className={`mt-2 text-2xl font-bold tabular-nums ${accent}`}>
        {value}
      </div>
      {hint && (
        <div className="mt-1 text-xs text-neutral-500">{hint}</div>
      )}
    </div>
  );
}

function SkeletonBlock() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-6 w-40 animate-pulse rounded bg-neutral-200" />
      <div className="grid grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg bg-neutral-200"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-lg bg-neutral-200" />
    </div>
  );
}
