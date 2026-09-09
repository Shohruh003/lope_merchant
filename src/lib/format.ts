/// Format an integer som value as a currency-ish string. Uses NBSP
/// as the thousands separator (Uzbek convention) — 1 250 000 so'm.
export function formatSom(v: number): string {
  const abs = Math.abs(Math.round(v));
  const sign = v < 0 ? '−' : '';
  const grouped = abs
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${sign}${grouped} so'm`;
}

export function formatShortSom(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)} mlrd`;
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} mln`;
  if (abs >= 1_000) return `${(v / 1_000).toFixed(1)} ming`;
  return String(Math.round(v));
}

/// Parse an ISO timestamp and format as a short local time.
export function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatHourLabel(hour: string): string {
  // hour is 'YYYY-MM-DDTHH' UTC — render as Tashkent-local HH:00.
  const d = new Date(`${hour}:00:00Z`);
  return d.toLocaleTimeString('uz-UZ', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
