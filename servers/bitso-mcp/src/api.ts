const UA = 'mrfentmen-bitso-mcp/1.0';

export interface TickerArgs {
  book: string;
}

export async function ticker(args: TickerArgs): Promise<string> {
  const book = (args.book ?? '').trim().toLowerCase();
  if (!book) return 'Provide a book like btc_mxn.';
  const res = await fetch(`https://api.bitso.com/v3/ticker/?book=${encodeURIComponent(book)}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Bitso returned ${res.status}`);
  const d = (await res.json()) as { success?: boolean; payload?: { last?: string; high?: string; low?: string; bid?: string; ask?: string; volume?: string; created_at?: string } };
  if (!d.success || !d.payload) throw new Error('Bitso: no ticker data');
  const p = d.payload;
  return [
    `Bitso ${book}:`,
    `Last: ${p.last ?? '?'} MXN | Bid: ${p.bid ?? '?'} | Ask: ${p.ask ?? '?'}`,
    `High: ${p.high ?? '?'} | Low: ${p.low ?? '?'} | Volume: ${p.volume ?? '?'}`,
    `Updated: ${p.created_at ?? '?'}`,
  ].filter(Boolean).join('\n');
}

// ---- muxA tools:
interface BitsoLevel {
  book?: string
  price?: string
  amount?: string
}

interface BitsoOrderBook {
  updated_at?: string
  sequence?: string
  bids?: BitsoLevel[]
  asks?: BitsoLevel[]
}

interface BitsoTicker {
  book?: string
  last?: string
  high?: string
  low?: string
  ask?: string
  bid?: string
  volume?: string
  vwap?: string
  change_24?: string
}

interface BitsoFeeTier {
  volume?: string
  maker?: string
  taker?: string
}

interface BitsoBookInfo {
  book?: string
  minimum_amount?: string
  maximum_amount?: string
  minimum_value?: string
  maximum_value?: string
  minimum_price?: string
  maximum_price?: string
  tick_size?: string
  margin_enabled?: boolean
  fees?: { flat_rate?: { maker?: string; taker?: string }; structure?: BitsoFeeTier[] }
}

async function bitsoGet<T>(path: string): Promise<T> {
  const res = await fetch(`https://api.bitso.com/v3${path}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`Bitso returned ${res.status}`)
  const d = (await res.json()) as { success?: boolean; payload?: T }
  if (!d.success || d.payload === undefined) throw new Error("Bitso: no data in response")
  return d.payload
}

export async function tradingFees(args: { book?: string }): Promise<string> {
  const all = await bitsoGet<BitsoBookInfo[]>("/available_books/")
  if (!Array.isArray(all) || !all.length) return "Bitso returned no tradable books."
  const wanted = (args.book ?? "").trim().toLowerCase()
  if (wanted) {
    const hit = all.find((b) => b.book === wanted)
    if (!hit) {
      return `Bitso lists no "${wanted}" book. It currently lists ${all.length} books.`
    }
    const tiers = (hit.fees?.structure ?? []).slice(0, 9)
    return [
      `Bitso trading limits and fees for ${wanted}:`,
      `  Maker fee (flat) : ${hit.fees?.flat_rate?.maker ?? "not reported"}`,
      `  Taker fee (flat) : ${hit.fees?.flat_rate?.taker ?? "not reported"}`,
      `  Tick size        : ${hit.tick_size ?? "not reported"}`,
      `  Minimum amount   : ${hit.minimum_amount ?? "not reported"}`,
      `  Maximum amount   : ${hit.maximum_amount ?? "not reported"}`,
      `  Minimum value    : ${hit.minimum_value ?? "not reported"}`,
      `  Maximum value    : ${hit.maximum_value ?? "not reported"}`,
      `  Price range      : ${hit.minimum_price ?? "not reported"} — ${hit.maximum_price ?? "not reported"}`,
      `  Margin enabled   : ${hit.margin_enabled === true ? "yes" : "no"}`,
      `  Volume tiers (${tiers.length}):`,
      ...tiers.map((t) => `      volume ${t.volume ?? "?"} → maker ${t.maker ?? "?"} / taker ${t.taker ?? "?"}`),
    ].join("\n")
  }
  return [
    `Bitso lists ${all.length} books. Pass a book like btc_mxn for its full fee schedule.`,
    `  First 8 (flat maker / taker):`,
    ...all
      .slice(0, 8)
      .map(
        (b) =>
          `      ${(b.book ?? "?").padEnd(12)} maker ${b.fees?.flat_rate?.maker ?? "?"} / taker ${b.fees?.flat_rate?.taker ?? "?"}  tick ${b.tick_size ?? "?"}`,
      ),
  ].join("\n")
}
