export class PaddleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PaddleError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
function base(): string {
  return (process.env.PADDLE_BASE_URL ?? "https://api.paddle.com").replace(/\/$/, "");
}

function headers(): Record<string, string> {
  const k = process.env.PADDLE_API_KEY;
  if (!k) throw new PaddleError("Set PADDLE_API_KEY (Paddle sandbox key).");
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(base() + path, { signal: AbortSignal.timeout(30000), headers: headers() });
  } catch (e) {
    throw new PaddleError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new PaddleError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

export function listProducts(): Promise<string> {
  return get("/products");
}

export function getProduct(productId: string): Promise<string> {
  return get(`/products/${encodeURIComponent(productId)}`);
}

export function listPrices(productId?: string): Promise<string> {
  const q = productId ? `?product_id=${encodeURIComponent(productId)}` : "";
  return get(`/prices${q}`);
}

// ---- muxH tools:
const FX_BASE = "https://api.frankfurter.dev/v1"
const FX_UA = "paddle-mcp/1.1 (https://github.com/mrfentmen/paddle-mcp)"

const FX_DAYS = 3650

interface FxLatest {
  amount?: number
  base?: string
  date?: string
  message?: string
  rates?: Record<string, number>
}

interface FxSeries {
  amount?: number
  base?: string
  start_date?: string
  end_date?: string
  rates?: Record<string, Record<string, number>>
}

async function fxGet<T>(path: string): Promise<T> {
  const res = await fetch(`${FX_BASE}${path}`, {
    headers: { Accept: "application/json", "User-Agent": FX_UA },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 404) {
    throw new PaddleError("Unknown currency code. Frankfurter publishes 30 ECB currencies: AUD BRL CAD CHF CNY CZK DKK EUR GBP HKD HUF IDR ILS INR ISK JPY KRW MXN MYR NOK NZD PHP PLN RON SEK SGD THB TRY USD ZAR.")
  }
  if (!res.ok) throw new PaddleError(`Frankfurter API error ${res.status}: ${res.statusText}`)
  return (await res.json()) as T
}

const upperCode = (value: string, field: string): string => {
  const code = (value ?? "").trim().toUpperCase()
  if (!/^[A-Z]{3}$/.test(code)) throw new PaddleError(`${field} must be a 3-letter ISO 4217 code such as USD or EUR.`)
  return code
}

const round = (value: number, places: number): string => {
  const factor = 10 ** places
  return (Math.round(value * factor) / factor).toLocaleString(undefined, { maximumFractionDigits: places })
}

const isoDay = (date: Date): string => date.toISOString().slice(0, 10)

function shiftDays(date: Date, days: number): Date {
  const next = new Date(date.getTime())
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

/**
 * The whole daily reference board for one base currency, newest rates first.
 * Frankfurter serves the European Central Bank's daily reference rates, so a
 * Paddle price list can be shown in the currencies a merchant actually bills in.
 */
export async function listFxRates(args: { base?: string }): Promise<string> {
  const base = upperCode(args.base ?? "EUR", "base")
  const res = await fxGet<FxLatest>(`/latest?base=${base}`)
  const rates = res.rates ?? {}
  const names = Object.keys(rates)
  if (!names.length) throw new PaddleError(`Frankfurter published no rates for ${base}.`)
  const rows = names.sort().map((code) => [code, rates[code]] as const)
  const shown = rows.slice(0, 30)
  return [
    `Daily reference rates, base ${base}`,
    `  ${res.date ?? "date not reported"} - 1 ${base} buys:`,
    "",
    ...shown.map(([code, value]) => `  ${code}  ${round(value, 4)}`),
    rows.length > shown.length ? `  (+${rows.length - shown.length} more)` : "",
    "",
    "European Central Bank daily reference rates via frankfurter.dev; not a tradable quote.",
  ].join("\n")
}

/**
 * One amount converted between two currencies at the latest published rate,
 * which is the figure a merchant of record needs before pricing a sale.
 */
export async function convertAmount(args: { amount: number; from: string; to: string }): Promise<string> {
  const amount = Number(args.amount)
  if (!Number.isFinite(amount)) throw new PaddleError("amount must be a number.")
  const from = upperCode(args.from, "from")
  const to = upperCode(args.to, "to")
  if (from === to) throw new PaddleError("from and to are the same currency, so there is nothing to convert.")

  if (from === "EUR") {
    const res = await fxGet<FxLatest>(`/latest?base=${from}&symbols=${to}`)
    const rate = res.rates?.[to]
    if (typeof rate !== "number") throw new PaddleError(`Frankfurter published no ${from}->${to} rate.`)
    return [
      `Conversion: ${round(amount, 2)} ${from} = ${round(amount * rate, 2)} ${to}`,
      `  rate 1 ${from} = ${round(rate, 6)} ${to}, dated ${res.date ?? "not reported"}`,
      `  reference source: European Central Bank daily rates via frankfurter.dev`,
    ].join("\n")
  }

  // Cross rate: fetch both legs against EUR and divide, so no key is needed.
  const res = await fxGet<FxLatest>(`/latest?base=${from}&symbols=EUR,${to}`)
  const rates = res.rates ?? {}
  const toEur = rates.EUR
  const fromTo = rates[to]
  if (typeof toEur !== "number" || typeof fromTo !== "number") {
    throw new PaddleError(`Frankfurter could not build a ${from}->${to} cross rate from its ${res.date ?? "latest"} board.`)
  }
  const cross = fromTo / toEur
  return [
    `Conversion: ${round(amount, 2)} ${from} = ${round(amount * cross, 2)} ${to}`,
    `  ${from}->EUR ${round(toEur, 6)}, EUR->${to} ${round(fromTo, 6)}, cross rate ${round(cross, 6)}`,
    `  dated ${res.date ?? "not reported"}`,
    `  reference source: European Central Bank daily rates via frankfurter.dev`,
  ].join("\n")
}

/**
 * How a pair has moved over a window: the daily series summarised into a
 * start, end, high, low and mean, which is what a monthly billing report needs.
 */
export async function fxRateHistory(args: { from: string; to: string; days?: number }): Promise<string> {
  const from = upperCode(args.from, "from")
  const to = upperCode(args.to, "to")
  if (from === to) throw new PaddleError("from and to are the same currency, so there is no rate to chart.")
  const days = Math.min(Math.max(Math.trunc(args.days ?? 30), 2), FX_DAYS)

  const end = shiftDays(new Date(), 0)
  const start = shiftDays(end, -(days - 1))
  const path = `/latest?base=${from}&symbols=EUR,${to}`
  const first = await fxGet<FxLatest>(path)
  const series = await fxGet<FxSeries>(`/${isoDay(start)}..${isoDay(end)}?base=${from}&symbols=EUR,${to}`)

  const points: Array<[string, number]> = []
  for (const [date, row] of Object.entries(series.rates ?? {})) {
    const toEur = row.EUR
    const fromTo = row[to]
    if (typeof toEur !== "number" || typeof fromTo !== "number") continue
    points.push([date, fromTo / toEur])
  }
  points.sort((a, b) => (a[0] < b[0] ? -1 : 1))
  if (points.length < 2) throw new PaddleError(`Frankfurter has fewer than two ${from}->${to} observations in the last ${days} days.`)

  const values = points.map(([, rate]) => rate)
  const high = Math.max(...values)
  const low = Math.min(...values)
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const [firstDate, firstRate] = points[0]
  const [lastDate, lastRate] = points[points.length - 1]
  const change = ((lastRate - firstRate) / firstRate) * 100
  const latestTo = first.rates?.[to]
  const latestEur = first.rates?.EUR
  const latestCross = typeof latestTo === "number" && typeof latestEur === "number" ? latestTo / latestEur : lastRate

  const shown = points.slice(-10)
  return [
    `${from}->${to} over the last ${days} days (${points.length} published observations)`,
    `  ${firstDate}  1 ${from} = ${round(firstRate, 6)} ${to}`,
    `  ${lastDate}  1 ${from} = ${round(lastRate, 6)} ${to}`,
    `  change ${change >= 0 ? "+" : ""}${round(change, 2)}% over the window`,
    "",
    `  high ${round(high, 6)} | low ${round(low, 6)} | mean ${round(mean, 6)}`,
    latestCross === lastRate ? "" : `  latest board ${first.date ?? "not reported"}: 1 ${from} = ${round(latestCross, 6)} ${to}`,
    "",
    "Most recent published days:",
    ...shown.map(([date, rate]) => `  ${date}  ${round(rate, 6)}`),
    "",
    "European Central Bank daily reference rates via frankfurter.dev; weekends and holidays are absent.",
  ].join("\n")
}
