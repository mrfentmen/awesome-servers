/**
 * Deribit — public market data for crypto options and futures. Keyless.
 *
 * Verified live: POST-style public endpoints answer over GET, e.g.
 * /public/get_instruments?currency=BTC&kind=future returns `{result:[...]}` and
 * /public/ticker?instrument_name=BTC-PERPETUAL returns `{result:{...}}`.
 */
const API = "https://www.deribit.com/api/v2/public"

export class DeribitError extends Error {}

interface Instrument {
  instrument_name?: string
  kind?: string
  expiration_timestamp?: number
  strike?: number | null
  option_type?: string | null
  min_trade_amount?: number
  maker_commission?: number
  taker_commission?: number
}

interface Ticker {
  instrument_name?: string
  last_price?: number
  mark_price?: number
  index_price?: number
  best_bid_price?: number
  best_ask_price?: number
  open_interest?: number
  funding_8h?: number
  current_funding?: number
  estimated_delivery_price?: number
  timestamp?: number
  stats?: { volume?: number; high?: number; low?: number; price_change?: number }
}

interface Envelope<T> {
  result?: T
  error?: { code?: number; message?: string }
}

async function get<T>(path: string, timeoutMs = 25000): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${API}/${path}`, {
      signal: ctrl.signal,
      headers: { "user-agent": "deribit-mcp", accept: "application/json" },
    })
    const body = (await res.json()) as Envelope<T>
    if (body.error) throw new DeribitError(body.error.message ?? `Deribit error ${body.error.code ?? ""}`.trim())
    if (body.result === undefined) throw new DeribitError("Deribit returned no result")
    return body.result
  } catch (e) {
    if (e instanceof DeribitError) throw e
    if ((e as Error).name === "AbortError") throw new DeribitError("Deribit request timed out")
    throw new DeribitError(`Deribit request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

const KINDS = ["future", "option", "spot", "future_combo", "option_combo"]

const money = (v: number | undefined): string => (typeof v === "number" && Number.isFinite(v) ? v.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "n/a")

const when = (ms: number | undefined): string =>
  typeof ms === "number" && ms > 0 && ms < 32503680000000 ? new Date(ms).toISOString().slice(0, 10) : "perpetual"

export async function instruments(currency = "BTC", kind = "future", limit = 20): Promise<string> {
  const cur = currency.trim().toUpperCase()
  const k = kind.trim().toLowerCase()
  if (!/^[A-Z0-9]{2,10}$/.test(cur)) throw new DeribitError(`"${currency}" is not a Deribit currency`)
  if (!KINDS.includes(k)) throw new DeribitError(`kind must be one of ${KINDS.join(", ")}`)

  const params = new URLSearchParams({ currency: cur, kind: k, expired: "false" })
  const rows = await get<Instrument[]>(`get_instruments?${params.toString()}`)
  if (rows.length === 0) return `Deribit lists no ${k} instruments for ${cur}.`

  const sorted = [...rows].sort((a, b) => (a.expiration_timestamp ?? 0) - (b.expiration_timestamp ?? 0))
  const size = Number.isInteger(limit) ? Math.min(100, Math.max(1, limit)) : 20
  const top = sorted.slice(0, size)

  const lines = top.map((i, n) => {
    const extra = [when(i.expiration_timestamp), i.strike !== null && i.strike !== undefined ? `strike ${i.strike}` : "", i.option_type ?? ""]
      .filter((p) => p !== "")
      .join(" · ")
    return `${n + 1}. ${i.instrument_name ?? "unknown"} — ${extra}`
  })

  return [`${cur} ${k} instruments — ${rows.length} total, showing ${top.length}`, "", ...lines].join("\n")
}

export async function ticker(instrument: string): Promise<string> {
  const name = instrument.trim().toUpperCase()
  if (name === "") throw new DeribitError("instrument must not be empty")

  const t = await get<Ticker>(`ticker?instrument_name=${encodeURIComponent(name)}`)
  const stats = t.stats ?? {}

  return [
    t.instrument_name ?? name,
    "",
    `Last: ${money(t.last_price)}`,
    `Mark: ${money(t.mark_price)}`,
    `Index: ${money(t.index_price)}`,
    `Bid/ask: ${money(t.best_bid_price)} / ${money(t.best_ask_price)}`,
    `24h volume: ${money(stats.volume)}`,
    stats.high !== undefined ? `24h high/low: ${money(stats.high)} / ${money(stats.low)}` : "",
    stats.price_change !== undefined ? `24h change: ${stats.price_change.toFixed(2)}%` : "",
    `Open interest: ${money(t.open_interest)}`,
    t.funding_8h !== undefined ? `Funding 8h: ${(t.funding_8h * 100).toFixed(4)}%` : "",
    t.estimated_delivery_price !== undefined ? `Estimated delivery: ${money(t.estimated_delivery_price)}` : "",
    t.timestamp ? `Updated: ${new Date(t.timestamp).toISOString()}` : "",
  ]
    .filter((line) => line !== "")
    .join("\n")
}
