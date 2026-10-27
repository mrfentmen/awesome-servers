const UA = 'mrfentmen-twelvedata-mcp/1.0';

export interface QuoteArgs {
  symbol: string;
}

export async function quote(args: QuoteArgs): Promise<string> {
  const symbol = (args.symbol ?? '').trim().toUpperCase();
  if (!symbol) return 'Provide a stock symbol like AAPL.';
  const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=demo`;
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Twelve Data returned ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  if (d.status === 'error') throw new Error(`Twelve Data: ${String(d.message ?? d.code ?? 'error')}`);
  const get = (k: string) => String(d[k] ?? '?');
  return [
    `Twelve Data quote for ${symbol}:`,
    `Name: ${get('name')} | Exchange: ${get('exchange')} | Currency: ${get('currency')}`,
    `Price: ${get('close')} | Open: ${get('open')} | High: ${get('high')} | Low: ${get('low')}`,
    `Change: ${get('change')} (${get('percent_change')}%) | Volume: ${get('volume')}`,
    `Timestamp: ${get('datetime')}`,
  ].filter(Boolean).join('\n');
}
