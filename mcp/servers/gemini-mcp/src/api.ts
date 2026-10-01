const BASE = 'https://api.gemini.com/v1';

export interface TickerArgs {
  symbol: string;
}

export async function ticker(args: TickerArgs): Promise<string> {
  let symbol = (args.symbol ?? '').trim().toLowerCase();
  if (!symbol) return 'Provide a symbol like btcusd.';
  const res = await fetch(`${BASE}/pubticker/${encodeURIComponent(symbol)}`, {
    headers: { 'User-Agent': 'mrfentmen-gemini-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Gemini returned ${res.status}`);
  const d = (await res.json()) as { bid?: string; ask?: string; last?: string; volume?: { [k: string]: string }; timestamp?: string };
  return [
    `Gemini ${symbol}:`,
    `Last: ${d.last ?? '?'} | Bid: ${d.bid ?? '?'} | Ask: ${d.ask ?? '?'}`,
    d.volume ? `Volume: ${d.volume[symbol] ?? '?'}` : null,
  ].filter(Boolean).join('\n');
}

export async function pricefeed(_args?: unknown): Promise<string> {
  const res = await fetch(`${BASE}/pricefeed`, {
    headers: { 'User-Agent': 'mrfentmen-gemini-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Gemini returned ${res.status}`);
  const d = (await res.json()) as Array<{ pair?: string; price?: string; percentChange24h?: string }>;
  if (!Array.isArray(d) || !d.length) return 'No prices returned.';
  return `Gemini pricefeed (${d.length} pairs):\n` +
    d.slice(0, 40).map((p, i) => `${i + 1}. ${p.pair ?? '?'}: ${p.price ?? '?'} (${p.percentChange24h ?? '?'}% 24h)`).join('\n');
}

// ---- muxC tools:

