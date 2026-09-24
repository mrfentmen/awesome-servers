const BASE = 'https://api.coinbase.com/v2';

export interface SpotArgs {
  pair: string;
}

export interface ExchangeArgs {
  currency?: string;
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
