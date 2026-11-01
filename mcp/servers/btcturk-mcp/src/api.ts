/**
 * BtcTurk client.
 *
 * Public market data needs no key at all. Account and order endpoints are
 * signed: X-Signature is base64(HMAC-SHA256(secret, publicKey + uriPath + stamp))
 * where stamp is the current time in milliseconds.
 */
import { createHmac } from "node:crypto"

const BASE = "https://api.btcturk.com"

export class BtcTurkError extends Error {}

export interface Ticker {
  pair: string
  pairNormalized?: string
  last: number
  high: number
  low: number
  open: number
  volume: number
  average?: number
  dailyPercent?: number
  timestamp?: number
  numerator?: string
  denominator?: string
}

export interface ExchangeInfo {
  timezone?: string
  serverTime?: number
  symbols: Array<{
    name: string
    numerator: string
    denominator: string
    numeratorScale?: number
    denominatorScale?: number
    minimumOrderValue?: number
    status?: string
  }>
}

export interface Balance {
  asset: string
  free?: number
  locked?: number
  available?: number
  total?: number
}

export interface Trade {
  pair?: string
  tid?: number
  price: number
  amount: number
  side?: string
  timestamp?: number
}

export interface BtcTurkOrder {
  id?: string | number
  pairSymbol?: string
  orderType?: string
  orderMethod?: string
  price?: number
  quantity?: number
  quantityRemaining?: number
  status?: string
  createdAt?: number
}

interface Envelope<T> {
  success?: boolean
  message?: string
  code?: number
  data?: T
}

function credentials(): { publicKey: string; secretKey: string } {
  const publicKey = process.env.BTCTURK_PUBLIC_KEY
  const secretKey = process.env.BTCTURK_SECRET_KEY
  if (!publicKey) throw new BtcTurkError("Missing BTCTURK_PUBLIC_KEY (get it from your BtcTurk API page).")
  if (!secretKey) throw new BtcTurkError("Missing BTCTURK_SECRET_KEY (get it from your BtcTurk API page).")
  return { publicKey, secretKey }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { accept: "application/json", ...(init.headers as Record<string, string> | undefined) },
    signal: AbortSignal.timeout(20000),
  })
  const text = await res.text()
  let body: unknown
  try {
    body = JSON.parse(text)
  } catch {
    throw new BtcTurkError(`BtcTurk returned non-JSON (HTTP ${res.status}).`)
  }
  if (!res.ok) throw new BtcTurkError(`BtcTurk HTTP ${res.status}: ${describe(body, text)}`)
  const env = body as Envelope<T>
  if (env && typeof env === "object" && "data" in env && env.data !== undefined) return env.data
  return body as T
}

function describe(body: unknown, text: string): string {
  if (body && typeof body === "object") {
    const m = (body as { message?: unknown; error?: unknown }).message ?? (body as { error?: unknown }).error
    if (m) return String(m)
  }
  return text.slice(0, 200)
}

async function signed<T>(method: string, path: string, body?: unknown): Promise<T> {
  const { publicKey, secretKey } = credentials()
  const stamp = Date.now().toString()
  const signature = createHmac("sha256", secretKey).update(publicKey + path + stamp).digest("base64")
  const payload = body === undefined ? undefined : JSON.stringify(body)
  return request<T>(path, {
    method,
    body: payload,
    headers: {
      "X-PCK": publicKey,
      "X-Stamp": stamp,
      "X-Signature": signature,
      ...(payload ? { "content-type": "application/json" } : {}),
    },
  })
}

const q = (params: Record<string, string | number | undefined>): string => {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") sp.set(k, String(v))
  const s = sp.toString()
  return s ? `?${s}` : ""
}

// ---------- public market data ----------

export async function getAllTickers(): Promise<Ticker[]> {
  const d = await request<Ticker[]>("/api/v2/ticker")
  return Array.isArray(d) ? d : []
}

export async function getTicker(pair: string): Promise<Ticker> {
  const d = await request<Ticker[] | Ticker>(`/api/v2/ticker${q({ pairSymbol: pair.toUpperCase() })}`)
  const rows = Array.isArray(d) ? d : [d]
  const hit = rows.find((t) => t?.pair?.toUpperCase() === pair.toUpperCase())
  if (!hit) throw new BtcTurkError(`No ticker for pair ${pair.toUpperCase()}.`)
  return hit
}

export async function getExchangeInfo(): Promise<ExchangeInfo> {
  return request<ExchangeInfo>("/api/v2/server/exchangeinfo")
}

export async function getServerTime(): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>("/api/v2/server/time")
}

/** Order book levels come back as [price, amount] string pairs. */
export async function getOrderbook(pair: string, limit = 100): Promise<{ bids: string[][]; asks: string[][] }> {
  const d = await request<{ bids?: string[][]; asks?: string[][] }>(
    `/api/v2/orderbook${q({ pairSymbol: pair.toUpperCase(), limit })}`
  )
  return { bids: d.bids ?? [], asks: d.asks ?? [] }
}

export async function getTrades(pair: string, last = 50): Promise<Trade[]> {
  const d = await request<Trade[]>(`/api/v2/trades${q({ pairSymbol: pair.toUpperCase(), last })}`)
  return Array.isArray(d) ? d : []
}

/** resolution is in minutes: 1, 15, 60, 240, 1440 and so on. */
export async function getOhlc(pair: string, resolution = 60, from?: number, to?: number): Promise<unknown[][]> {
  const d = await request<unknown[][]>(
    `/api/v2/ohlc${q({ pairSymbol: pair.toUpperCase(), resolution, from, to })}`
  )
  return Array.isArray(d) ? d : []
}

// ---------- account and orders (signed) ----------

export async function getBalances(): Promise<Balance[]> {
  const d = await signed<{ balances?: Balance[] } | Balance[]>("GET", "/api/v1/users/balances")
  const rows = Array.isArray(d) ? d : d.balances ?? []
  return rows.filter((b) => b && b.asset)
}

export async function listOpenOrders(pair?: string): Promise<BtcTurkOrder[]> {
  const path = `/api/v2/orders${q({ pairSymbol: pair?.toUpperCase() })}`
  const d = await signed<BtcTurkOrder[] | { orders?: BtcTurkOrder[] }>("GET", path)
  return Array.isArray(d) ? d : d.orders ?? []
}

export interface PlaceOrderInput {
  pairSymbol: string
  orderMethod: "market" | "limit" | "stopMarket" | "stopLimit"
  orderType: "buy" | "sell"
  quantity: number
  price?: number
  stopPrice?: number
  clientOrderId?: string
}

export async function placeOrder(input: PlaceOrderInput): Promise<BtcTurkOrder> {
  return signed<BtcTurkOrder>("POST", "/api/v2/order", {
    pairSymbol: input.pairSymbol.toUpperCase(),
    orderMethod: input.orderMethod,
    orderType: input.orderType,
    quantity: String(input.quantity),
    ...(input.price !== undefined ? { price: String(input.price) } : {}),
    ...(input.stopPrice !== undefined ? { stopPrice: String(input.stopPrice) } : {}),
    ...(input.clientOrderId ? { clientOrderId: input.clientOrderId } : {}),
  })
}

export async function cancelOrder(orderId: string): Promise<unknown> {
  return signed<unknown>("DELETE", "/api/v2/order", { orderId })
}

// ---------- formatters ----------

const num = (v: unknown): string => (typeof v === "number" && Number.isFinite(v) ? String(v) : "-")

export function formatTicker(t: Ticker): string {
  return [
    `${t.pair}${t.pairNormalized ? ` (${t.pairNormalized})` : ""}`,
    `last ${num(t.last)}  open ${num(t.open)}  high ${num(t.high)}  low ${num(t.low)}`,
    `24h volume ${num(t.volume)}  change ${t.dailyPercent !== undefined ? `${t.dailyPercent.toFixed(2)}%` : "-"}`,
  ].join("\n")
}

export function formatTickerTable(tickers: Ticker[], limit = 25): string {
  const rows = tickers.slice(0, limit).map(
    (t) => `${t.pair.padEnd(14)} last ${num(t.last).padStart(12)}  high ${num(t.high).padStart(12)}  low ${num(t.low).padStart(12)}`
  )
  const head = `${tickers.length} pairs` + (tickers.length > limit ? ` (showing ${limit})` : "")
  return `${head}\n${rows.join("\n")}`
}

export function formatOrderbook(pair: string, book: { bids: string[][]; asks: string[][] }, depth = 10): string {
  const side = (label: string, rows: string[][]) => {
    const lines = rows.slice(0, depth).map((r, i) => `  ${String(i + 1).padStart(2)}. ${r[0] ?? "-"} × ${r[1] ?? "-"}`)
    return `${label} (${rows.length} levels)\n${lines.join("\n") || "  empty"}`
  }
  return `${pair.toUpperCase()} order book\n${side("ASKS", book.asks)}\n${side("BIDS", book.bids)}`
}

export function formatTrades(trades: Trade[]): string {
  if (trades.length === 0) return "No trades returned."
  return trades
    .map((t) => `${t.side ? `${t.side.toUpperCase()} ` : ""}${num(t.price)} × ${num(t.amount)}${t.timestamp ? `  ${new Date(t.timestamp).toISOString()}` : ""}`)
    .join("\n")
}

export function formatCandles(pair: string, rows: unknown[][]): string {
  if (rows.length === 0) return `No candles for ${pair.toUpperCase()}.`
  const fmt = (row: unknown[]) =>
    `  t=${row[0] ?? "-"}  o=${row[1] ?? "-"}  h=${row[2] ?? "-"}  l=${row[3] ?? "-"}  c=${row[4] ?? "-"}  v=${row[5] ?? "-"}`
  return `${pair.toUpperCase()} OHLC (${rows.length} candles, oldest first)\n${rows.slice(-30).map(fmt).join("\n")}`
}

export function formatBalances(balances: Balance[]): string {
  if (balances.length === 0) return "No balances with a non-zero amount."
  return balances
    .map((b) => `${b.asset.padEnd(8)} free ${num(b.free ?? b.available).padStart(16)}  locked ${num(b.locked).padStart(16)}`)
    .join("\n")
}

export function formatOrders(orders: BtcTurkOrder[]): string {
  if (orders.length === 0) return "No open orders."
  return orders
    .map(
      (o) =>
        `${String(o.id ?? "-").padEnd(14)} ${String(o.pairSymbol ?? "-").padEnd(10)} ${String(o.orderType ?? "-").padEnd(4)} ${String(o.orderMethod ?? "-").padEnd(10)} price ${num(o.price)}  qty ${num(o.quantity)}  left ${num(o.quantityRemaining)}  ${o.status ?? ""}`
    )
    .join("\n")
}

export function formatSymbols(info: ExchangeInfo): string {
  const symbols = info.symbols ?? []
  const rows = symbols.slice(0, 60).map(
    (s) => `${s.name.padEnd(14)} ${s.numerator}/${s.denominator}${s.status ? `  ${s.status}` : ""}`
  )
  return `${symbols.length} pairs${symbols.length > 60 ? " (showing 60)" : ""}\n${rows.join("\n")}`
}
