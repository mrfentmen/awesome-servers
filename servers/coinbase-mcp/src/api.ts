const BASE = 'https://api.coinbase.com/v2';

export interface SpotArgs {
  pair: string;
}

export interface ExchangeArgs {
  currency?: string;
}

export interface BuyArgs {
  pair: string;
}

export interface SellArgs {
  pair: string;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'User-Agent': 'mrfentmen-coinbase-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Coinbase returned ${res.status}`);
  return (await res.json()) as T;
}

export async function spot(args: SpotArgs): Promise<string> {
  const pair = (args.pair ?? '').trim().toUpperCase();
  if (!pair) return 'Provide a pair like BTC-USD.';
  const res = await fetch(`${BASE}/prices/${encodeURIComponent(pair)}/spot`, {
    headers: { 'User-Agent': 'mrfentmen-coinbase-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Coinbase returned ${res.status}`);
  const d = (await res.json()) as { data?: { base?: string; currency?: string; amount?: string } };
  const data = d.data ?? {};
  return `Coinbase ${data.base ?? pair}/${data.currency ?? 'USD'}: ${data.amount ?? 'n/a'}`;
}

export async function exchange(args: ExchangeArgs): Promise<string> {
  const currency = (args?.currency ?? 'USD').trim().toUpperCase();
  const res = await fetch(`${BASE}/exchange-rates?currency=${encodeURIComponent(currency)}`, {
    headers: { 'User-Agent': 'mrfentmen-coinbase-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Coinbase returned ${res.status}`);
  const d = (await res.json()) as { data?: { currency?: string; rates?: Record<string, string> } };
  const data = d.data ?? {};
  const rates = data.rates ?? {};
  const keys = Object.keys(rates);
  if (!keys.length) return 'No rates returned.';
  return `Coinbase exchange rates from ${data.currency ?? currency} (${keys.length} currencies):\n` +
    keys.slice(0, 40).map((k) => `  ${k}: ${rates[k]}`).join('\n');
}

export async function buy(args: BuyArgs): Promise<string> {
  const pair = (args.pair ?? '').trim().toUpperCase();
  if (!pair) return 'Provide a pair like BTC-USD.';
  const d = await getJson<{ data?: { base?: string; currency?: string; amount?: string } }>(
    `/prices/${encodeURIComponent(pair)}/buy`);
  const data = d.data ?? {};
  return `Coinbase buy price ${data.base ?? pair}/${data.currency ?? 'USD'}: ${data.amount ?? 'n/a'}`;
}

export async function sell(args: SellArgs): Promise<string> {
  const pair = (args.pair ?? '').trim().toUpperCase();
  if (!pair) return 'Provide a pair like BTC-USD.';
  const d = await getJson<{ data?: { base?: string; currency?: string; amount?: string } }>(
    `/prices/${encodeURIComponent(pair)}/sell`);
  const data = d.data ?? {};
  return `Coinbase sell price ${data.base ?? pair}/${data.currency ?? 'USD'}: ${data.amount ?? 'n/a'}`;
}

export async function currencies(): Promise<string> {
  const d = await getJson<{ data?: { id?: string; name?: string }[] }>('/currencies');
  const list = d.data ?? [];
  const fiats = list.filter((c) => c.id && c.id.length === 3).length;
  const sample = list.slice(0, 15).map((c) => `${c.id} (${c.name ?? '?'})`).join(', ');
  return `Coinbase supports ${list.length} currencies (${fiats} fiat codes). Sample: ${sample}. Full list omitted for size.`;
}

export async function time(): Promise<string> {
  const d = await getJson<{ data?: { iso?: string; epoch?: number } }>('/time');
  return `Coinbase server time: ${d.data?.iso ?? 'n/a'} (epoch ${d.data?.epoch ?? 'n/a'})`;
}
