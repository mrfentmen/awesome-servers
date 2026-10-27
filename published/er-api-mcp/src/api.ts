
interface m0_RatesResponse {
  result?: string;
  base_code?: string;
  time_last_update_utc?: string;
  rates?: Record<string, number>;
}

export interface m0_BaseArg {
  base?: string;
}
export interface m0_ConvertArgs {
  from: string;
  to: string;
  amount: number;
}

export interface m1_LatestArgs {
  base?: string;
}

export interface m1_HistoryArgs {
  base?: string;
  symbols?: string;
}

interface m1_ErResponse {
  result?: string;
  base_code?: string;
  rates?: Record<string, number>;
  time_last_update_utc?: string;
}

const m0 = (() => {
const UA = 'mrfentmen-er-api-mcp/1.0';
const BASE = 'https://open.er-api.com/v6/latest';

async function latest(args: m0_BaseArg): Promise<string> {
  const base = String(args?.base ?? 'USD').toUpperCase();
  const res = await fetch(`${BASE}/${encodeURIComponent(base)}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`ER API returned ${res.status}`);
  const d = (await res.json()) as m0_RatesResponse;
  if (d.result !== 'success' || !d.rates) throw new Error(`ER API error: ${d.result ?? 'unknown'}`);
  const rates = d.rates;
  const top = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'CAD', 'AUD', 'CHF', 'INR', 'BRL'].filter((c) => rates[c] != null);
  return `Exchange rates base ${d.base_code ?? base} (updated ${d.time_last_update_utc ?? '?'}):\n` + top.map((c) => `* ${c}: ${rates[c]}`).join('\n');
}

async function convert(args: m0_ConvertArgs): Promise<string> {
  const from = String(args.from).toUpperCase();
  const to = String(args.to).toUpperCase();
  const amount = Number(args.amount);
  if (!from || !to || !Number.isFinite(amount) || amount <= 0) throw new Error('Provide a valid from, to, and positive amount.');
  const res = await fetch(`${BASE}/${encodeURIComponent(from)}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`ER API returned ${res.status}`);
  const d = (await res.json()) as m0_RatesResponse;
  const rate = d.rates?.[to];
  if (rate == null) throw new Error(`No rate for ${to} (base ${from}).`);
  return `${amount} ${from} = ${(amount * rate).toFixed(2)} ${to} (rate ${rate})`;
}

return { convert, latest };
})();

const m1 = (() => {
const BASE = 'https://open.er-api.com/v6';

async function latest(args: m1_LatestArgs = {}): Promise<string> {
  const base = (args.base ?? 'USD').toUpperCase();
  const res = await fetch(`${BASE}/latest/${base}`, {
    headers: { 'User-Agent': 'mrfentmen-currency-history-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`ExchangeRate API returned ${res.status}`);
  const data = (await res.json()) as m1_ErResponse;
  if (data.result !== 'success' || !data.rates) throw new Error('ExchangeRate API returned no rates');
  const entries = Object.entries(data.rates).slice(0, 30);
  return `Exchange rates vs ${data.base_code} (${data.time_last_update_utc ?? ''}):\n` + entries.map(([code, rate], i) => `${i + 1}. ${code}: ${rate}`).join('\n');
}

async function history(args: m1_HistoryArgs = {}): Promise<string> {
  const base = (args.base ?? 'USD').toUpperCase();
  const res = await fetch(`${BASE}/latest/${base}`, {
    headers: { 'User-Agent': 'mrfentmen-currency-history-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`ExchangeRate API returned ${res.status}`);
  const data = (await res.json()) as m1_ErResponse;
  if (data.result !== 'success' || !data.rates) throw new Error('ExchangeRate API returned no rates');
  const wanted = (args.symbols ?? '')
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  const entries = wanted.length
    ? wanted.map((code) => [code, data.rates?.[code]] as const).filter(([, v]) => typeof v === 'number')
    : Object.entries(data.rates).slice(0, 15);
  if (!entries.length) return `No rates found for ${wanted.join(', ')}.`;
  return `Exchange rates vs ${data.base_code} (${data.time_last_update_utc ?? ''}):\n` + entries.map(([code, rate], i) => `${i + 1}. ${code}: ${rate}`).join('\n');
}

return { history, latest };
})();

export const convert = m0.convert;
export const history = m1.history;
export const latest = m0.latest;
export const m0_latest = m0.latest;
export const m0_convert = m0.convert;
export const m1_latest = m1.latest;
export const m1_history = m1.history;

// ---- muxC tools:

