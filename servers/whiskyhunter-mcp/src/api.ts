const UA = 'mrfentmen-whiskyhunter-mcp/1.0';

export interface AuctionsArgs {
  limit?: number;
}

export async function auctions(args: AuctionsArgs): Promise<string> {
  const limit = Math.min(Math.max(Number(args?.limit ?? 5) || 5, 1), 20);
  const res = await fetch('https://whiskyhunter.net/api/auctions_data/', {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`WhiskyHunter returned ${res.status}`);
  const d = (await res.json()) as Array<{ dt?: string; winning_bid_mean?: number; auction_trading_volume?: number; number_of_bottles?: number; number_of_bids?: number }>;
  if (!Array.isArray(d) || !d.length) return 'No auction data returned.';
  return `WhiskyHunter auction data (${d.length} records, showing ${Math.min(limit, d.length)}):\n` +
    d.slice(0, limit).map((a, i) => `${i + 1}. ${a.dt ?? '?'}: mean bid ${a.winning_bid_mean ?? '?'} | volume ${a.auction_trading_volume ?? '?'} | bottles ${a.number_of_bottles ?? '?'} | bids ${a.number_of_bids ?? '?'}`).join('\n');
}
