
export interface m0_LatestArgs {
  from?: string;
  to?: string;
}

export interface m0_HistoryArgs {
  from: string;
  to: string;
  start: string;
  end: string;
}

export interface m1_ConvertArgs {
  amount: number;
  from?: string;
  to: string;
}

const m0 = (() => {
const BASE = 'https://api.frankfurter.app';

async function latest(args: m0_LatestArgs): Promise<string> {
  const from = (args.from ?? 'USD').toUpperCase();
  const to = (args.to ?? '').toUpperCase();
  const url = `${BASE}/latest?from=${encodeURIComponent(from)}${to ? `&to=${encodeURIComponent(to)}` : ''}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'mrfentmen-frankfurter-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Frankfurter returned ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  const rates = (d.rates ?? {}) as Record<string, unknown>;
  if (!Object.keys(rates).length) return 'No rates returned.';
  return `Rates for ${String(d.base ?? from)} on ${String(d.date ?? '')}:\n` +
    Object.entries(rates).slice(0, 20).map(([k, v]) => `${k}: ${String(v)}`).join('\n');
}

async function history(args: m0_HistoryArgs): Promise<string> {
  const from = (args.from ?? '').toUpperCase();
  const to = (args.to ?? '').toUpperCase();
  const start = (args.start ?? '').trim();
  const end = (args.end ?? '').trim();
  if (!from || !to || !start || !end) return 'Provide from, to, start, and end.';
  const res = await fetch(`${BASE}/${start}..${end}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, {
    headers: { 'User-Agent': 'mrfentmen-frankfurter-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Frankfurter returned ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  const rates = (d.rates ?? {}) as Record<string, Record<string, unknown>>;
  const dates = Object.keys(rates).sort();
  if (!dates.length) return 'No history returned.';
  const rows = dates.map((dt) => `${dt}: ${String(rates[dt][to] ?? 'n/a')}`);
  return `Rate history ${from} -> ${to} (${dates.length} days):\n` + rows.join('\n');
}

return { history, latest };
})();

const m1 = (() => {
const BASE = 'https://api.frankfurter.app';

async function latest(_args: Record<string, never> = {}): Promise<string> {
  const res = await fetch(`${BASE}/latest`, {
    headers: { 'User-Agent': 'mrfentmen-ecb-rates-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Frankfurter returned ${res.status}`);
  const data = (await res.json()) as { date?: string; rates?: Record<string, number> };
  const rates = data.rates ?? {};
  const entries = Object.entries(rates).slice(0, 30);
  if (!entries.length) throw new Error('Frankfurter returned no rates');
  return `ECB reference rates vs EUR (${data.date ?? ''}):\n` + entries.map(([code, rate], i) => `${i + 1}. ${code}: ${rate}`).join('\n');
}

async function convert(args: m1_ConvertArgs): Promise<string> {
  const amount = Number(args.amount);
  if (!Number.isFinite(amount) || amount < 0) return 'Provide a positive amount.';
  const from = (args.from ?? 'EUR').toUpperCase();
  const to = (args.to ?? '').trim().toUpperCase();
  if (!to) return 'Provide a target currency code.';
  const res = await fetch(`${BASE}/latest?from=${from}&to=${to}`, {
    headers: { 'User-Agent': 'mrfentmen-ecb-rates-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Frankfurter returned ${res.status}`);
  const data = (await res.json()) as { date?: string; rates?: Record<string, number> };
  const rate = data.rates?.[to];
  if (typeof rate !== 'number') return `No rate found for ${from} to ${to}.`;
  const result = amount * rate;
  return `${amount.toLocaleString()} ${from} = ${result.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${to} (rate ${rate}, ${data.date ?? ''})`;
}

return { convert, latest };
})();

export const convert = m1.convert;
export const history = m0.history;
export const latest = m0.latest;
export const m0_latest = m0.latest;
export const m0_history = m0.history;
export const m1_latest = m1.latest;
export const m1_convert = m1.convert;

// ---- muxC tools:

