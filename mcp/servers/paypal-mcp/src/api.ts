export class PaypalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PaypalError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

let cached: { token: string; expiresAt: number } | null = null;

function creds(): { id: string; secret: string } {
  const id = process.env.PAYPAL_SANDBOX_CLIENT_ID;
  const secret = process.env.PAYPAL_SANDBOX_SECRET;
  if (!id || !secret) throw new PaypalError("Set PAYPAL_SANDBOX_CLIENT_ID and PAYPAL_SANDBOX_SECRET.");
  return { id, secret };
}

async function token(): Promise<string> {
  const { id, secret } = creds();
  if (cached && Date.now() < cached.expiresAt) return cached.token;
  let res: Response;
  try {
    res = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: { ...UA, Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}` },
      body: "grant_type=client_credentials",
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new PaypalError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new PaypalError(`Token error HTTP ${res.status}: ${body}`);
  }
  const d = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!d.access_token) throw new PaypalError("Token error: no access_token.");
  cached = { token: d.access_token, expiresAt: Date.now() + (d.expires_in ?? 3600) * 1000 - 60000 };
  return d.access_token;
}

async function get(path: string): Promise<string> {
  const t = await token();
  let res: Response;
  try {
    res = await fetch("https://api-m.sandbox.paypal.com" + path, {
      headers: { ...UA, Accept: "application/json", Authorization: `Bearer ${t}` },
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new PaypalError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new PaypalError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 8000);
}

export function getOrder(orderId: string): Promise<string> {
  return get(`/v2/checkout/orders/${encodeURIComponent(orderId)}`);
}

export function getCapture(captureId: string): Promise<string> {
  return get(`/v2/payments/captures/${encodeURIComponent(captureId)}`);
}

export function listPlans(): Promise<string> {
  return get("/v1/billing/plans?page_size=10");
}



export function planDetails(planId: string): Promise<string> {
  return get(`/v1/billing/plans/${encodeURIComponent(planId)}`);
}

export function listProducts(): Promise<string> {
  return get("/v1/catalogs/products?page_size=10");
}

export function productDetails(productId: string): Promise<string> {
  return get(`/v1/catalogs/products/${encodeURIComponent(productId)}`);
}

export function subscriptionDetails(subscriptionId: string): Promise<string> {
  return get(`/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`);
}

export function payoutDetails(payoutId: string): Promise<string> {
  return get(`/v1/payments/payouts/${encodeURIComponent(payoutId)}`);
}

export function listWebhooks(): Promise<string> {
  return get("/v1/notifications/webhooks");
}

export function disputeDetails(disputeId: string): Promise<string> {
  return get(`/v1/customer/disputes/${encodeURIComponent(disputeId)}`);
}

// ---- muxH tools:
const WBank = "https://api.worldbank.org/v2"
const WBankUA = "paypal-mcp/1.1 (https://github.com/mrfentmen/paypal-mcp)"
const FX_INDICATOR = "PA.NUS.FCRF"
const GDP_INDICATOR = "NY.GDP.PCAP.CD"

interface WbMeta {
  message?: Array<{ key?: string; value?: string }>
}

interface WbCountry {
  id?: string
  iso2Code?: string
  name?: string
  region?: { id?: string; value?: string }
  incomeLevel?: { id?: string; value?: string }
  capitalCity?: string
  longitude?: number
  latitude?: number
}

interface WbObservation {
  indicator?: { id?: string; value?: string }
  country?: { id?: string; value?: string }
  countryiso3code?: string
  date?: string
  value?: number | null
}

async function wbGet<T>(path: string): Promise<T> {
  const res = await fetch(`${WBank}${path}`, {
    headers: { Accept: "application/json", "User-Agent": WBankUA },
    signal: AbortSignal.timeout(45000),
  })
  if (!res.ok) throw new PaypalError(`World Bank API error ${res.status}: ${res.statusText}`)
  const body = (await res.json()) as T | WbMeta
  const message = (body as WbMeta)?.message
  if (Array.isArray(message) && message.length) {
    throw new PaypalError(`World Bank rejected the query: ${message.map((m) => m.value ?? m.key ?? "unknown").join("; ")}`)
  }
  return body as T
}

const wbMoney = (value: number): string =>
  `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`

const wbRate = (value: number): string =>
  value.toLocaleString(undefined, { maximumFractionDigits: 4 })

let countryCache: WbCountry[] | null = null

async function wbCountries(): Promise<WbCountry[]> {
  if (!countryCache) {
    const body = await wbGet<[unknown, WbCountry[]]>("/country?format=json&per_page=400")
    const rows = Array.isArray(body) && Array.isArray(body[1]) ? body[1] : []
    // Aggregates (regions, income groups) come back with region id NA; keep only
    // real economies so a country lookup cannot land on "Euro area".
    countryCache = rows.filter((c) => c?.id && c?.region?.id && c.region.id !== "NA" && /^[A-Z]{3}$/.test(c.id))
  }
  return countryCache
}

async function resolveCountry(input: string): Promise<WbCountry> {
  const q = (input ?? "").trim()
  if (!q) throw new PaypalError("Name a country, e.g. 'Brazil', 'BR' or 'BRA'.")
  const countries = await wbCountries()
  const lower = q.toLowerCase()
  const hit =
    countries.find((c) => c.id?.toLowerCase() === lower) ??
    countries.find((c) => c.iso2Code?.toLowerCase() === lower) ??
    countries.find((c) => c.name?.toLowerCase() === lower) ??
    countries.find((c) => c.name?.toLowerCase().includes(lower))
  if (!hit) throw new PaypalError(`The World Bank has no economy matching "${input}".`)
  return hit
}

interface FxPoint {
  year: string
  rate: number
}

/** Official annual LCU-per-USD observations, oldest first. */
async function fxSeries(code: string, fromYear: number, toYear: number): Promise<FxPoint[]> {
  const span = Math.max(fromYear, toYear - 29)
  const body = await wbGet<[unknown, WbObservation[]]>(
    `/country/${encodeURIComponent(code)}/indicator/${FX_INDICATOR}?format=json&per_page=40&date=${span}:${toYear}`
  )
  const rows = Array.isArray(body) && Array.isArray(body[1]) ? body[1] : []
  return rows
    .filter((r) => typeof r.value === "number" && r.date)
    .map((r) => ({ year: r.date as string, rate: r.value as number }))
    .sort((a, b) => (a.year < b.year ? -1 : 1))
}

function yearOfToday(): number {
  return new Date().getUTCFullYear()
}

/**
 * The payout picture for one market: the World Bank's official exchange rate
 * against the dollar, its income tier, and where its currency has moved over
 * the last five published years.
 */
export async function payoutMarketProfile(args: { country: string }): Promise<string> {
  const country = await resolveCountry(args.country)
  const code = country.id as string
  const thisYear = yearOfToday()
  const series = await fxSeries(code, thisYear - 6, thisYear)
  if (!series.length) {
    return [
      `${country.name} (${code})`,
      `  region: ${country.region?.value?.trim() ?? "not reported"}`,
      `  income level: ${country.incomeLevel?.value ?? "not reported"}`,
      "  The World Bank publishes no official exchange rate for this economy, so no payout rate is available.",
    ].join("\n")
  }

  const latest = series[series.length - 1]
  const first = series[0]
  const change = ((latest.rate - first.rate) / first.rate) * 100
  const rates = series.map((p) => p.rate)
  const high = Math.max(...rates)
  const low = Math.min(...rates)

  return [
    `Payout market: ${country.name} (${code}, ${country.iso2Code ?? "iso2 not reported"})`,
    `  region: ${country.region?.value?.trim() ?? "not reported"}`,
    `  income level: ${country.incomeLevel?.value ?? "not reported"}`,
    `  capital: ${country.capitalCity || "not reported"}`,
    "",
    `  official rate ${thisYear === Number(latest.year) ? "latest" : "most recent"}: ${wbRate(latest.rate)} local units per US$ (${latest.year})`,
    `  five-year band: ${wbRate(low)} to ${wbRate(high)} over ${series.length} published years, ${first.year}-${latest.year}`,
    change >= 0
      ? `  the currency has weakened ${change.toFixed(1)}% against the dollar over that span, so a fixed USD payout buys less local currency.`
      : `  the currency has strengthened ${Math.abs(change).toFixed(1)}% against the dollar over that span, so a fixed USD payout buys more local currency.`,
    "",
    "Source: World Bank official exchange rate (LCU per US$, period average). Not a live quote.",
  ].join("\n")
}

/**
 * The year-by-year official rate for one market, with the change each year and
 * the cumulative move, which is the series a payout schedule is forecast on.
 */
export async function payoutFxTrend(args: { country: string; years?: number }): Promise<string> {
  const country = await resolveCountry(args.country)
  const code = country.id as string
  const years = Math.min(Math.max(Math.trunc(args.years ?? 8), 2), 20)
  const thisYear = yearOfToday()
  const series = await fxSeries(code, thisYear - years + 1, thisYear)
  if (series.length < 2) {
    throw new PaypalError(`The World Bank published ${series.length} usable observation(s) for ${country.name}; ask for a longer window or a different market.`)
  }

  const rows = series.map((point, i) => {
    const prior = series[i - 1]
    const delta = prior ? ((point.rate - prior.rate) / prior.rate) * 100 : null
    return { ...point, delta }
  })
  const first = series[0]
  const last = series[series.length - 1]
  const total = ((last.rate - first.rate) / first.rate) * 100
  const gains = rows.filter((r) => (r.delta ?? 0) > 0).length

  return [
    `Official FX trend: ${country.name} (${code}), local units per US$`,
    `  ${rows.length} published years, ${first.year} to ${last.year}`,
    "",
    ...rows.map((r) => `  ${r.year}  ${wbRate(r.rate).padStart(12)}${r.delta === null ? "        (first year in window)" : `   ${r.delta >= 0 ? "+" : ""}${r.delta.toFixed(1)}% year on year`}`),
    "",
    `  cumulative move: ${total >= 0 ? "+" : ""}${total.toFixed(1)}% over the window`,
    `  ${gains} of ${rows.length - 1} year-on-year moves were against the dollar`,
    "Source: World Bank official exchange rate, period average. Not a live quote.",
  ].join("\n")
}

/**
 * Rank markets for a payout programme: the economies in one region or income
 * tier, each with its official rate and how far it has moved this decade.
 */
export async function payoutMarketScan(args: { region?: string; income_level?: string; limit?: number }): Promise<string> {
  const size = Math.min(Math.max(Math.trunc(args.limit ?? 10), 1), 15)
  const region = (args.region ?? "").trim().toLowerCase()
  const income = (args.income_level ?? "").trim().toLowerCase()
  if (!region && !income) {
    throw new PaypalError("Give a region (e.g. 'East Asia') or an income level (e.g. 'upper middle income') to scan.")
  }
  const countries = await wbCountries()
  const matched = countries.filter((c) => {
    const regionHit = region ? (c.region?.value ?? "").trim().toLowerCase().includes(region) : false
    const incomeHit = income ? (c.incomeLevel?.value ?? "").toLowerCase().includes(income) : false
    return region && income ? regionHit && incomeHit : regionHit || incomeHit
  })
  if (!matched.length) {
    throw new PaypalError(`No economy matched region "${args.region ?? ""}" and income level "${args.income_level ?? ""}".`)
  }

  const thisYear = yearOfToday()
  const shortlist = matched.slice(0, size)
  const codes = shortlist.map((c) => c.id as string)
  // One request per indicator for the whole shortlist: the World Bank takes a
  // semicolon-separated country list, and a request per country is slow enough
  // to time the tool out.
  const list = codes.map(encodeURIComponent).join(";")
  const [fxBody, gdpBody] = await Promise.all([
    wbGet<[unknown, WbObservation[]]>(
      `/country/${list}/indicator/${FX_INDICATOR}?format=json&per_page=200&date=${thisYear - 10}:${thisYear}`
    ),
    wbGet<[unknown, WbObservation[]]>(
      `/country/${list}/indicator/${GDP_INDICATOR}?format=json&per_page=40&date=${thisYear - 1}:${thisYear}`
    ),
  ])
  const fxRows = Array.isArray(fxBody) && Array.isArray(fxBody[1]) ? fxBody[1] : []
  const gdpRows = Array.isArray(gdpBody) && Array.isArray(gdpBody[1]) ? gdpBody[1] : []

  const byCode = new Map<string, FxPoint[]>()
  for (const row of fxRows) {
    const code = row.countryiso3code
    if (!code || typeof row.value !== "number" || !row.date) continue
    const list = byCode.get(code) ?? []
    list.push({ year: row.date, rate: row.value })
    byCode.set(code, list)
  }
  const gdpByCode = new Map<string, number>()
  for (const row of gdpRows) {
    if (row.countryiso3code && typeof row.value === "number") gdpByCode.set(row.countryiso3code, row.value)
  }

  const rows: Array<{ name: string; code: string; rate: number; year: string; decadal: number; gdp: number | null }> = []
  for (const country of shortlist) {
    const code = country.id as string
    const series = (byCode.get(code) ?? []).sort((a, b) => (a.year < b.year ? -1 : 1))
    if (!series.length) continue
    const latest = series[series.length - 1]
    const decadeAgo = series.find((p) => Number(p.year) <= thisYear - 10) ?? series[0]
    rows.push({
      name: country.name ?? code,
      code,
      rate: latest.rate,
      year: latest.year,
      decadal: ((latest.rate - decadeAgo.rate) / decadeAgo.rate) * 100,
      gdp: gdpByCode.get(code) ?? null,
    })
  }
  if (!rows.length) throw new PaypalError("None of the matched economies has a published official exchange rate.")

  rows.sort((a, b) => (b.gdp ?? 0) - (a.gdp ?? 0))
  return [
    `Payout market scan: ${region ? `region containing "${args.region}"` : `income level containing "${args.income_level}"`}`,
    `  ${rows.length} of ${matched.length} matched economies report an official rate`,
    "",
    ...rows.map(
      (r, i) =>
        `${String(i + 1).padStart(2)}. ${r.name} (${r.code}) — ${wbRate(r.rate)} per US$ (${r.year}) | GDP per capita ${r.gdp === null ? "not reported" : wbMoney(r.gdp)} | ${r.decadal >= 0 ? "+" : ""}${r.decadal.toFixed(0)}% over ${thisYear - 10}-${r.year}`
    ),
    "",
    "Sorted by GDP per capita, most to least. Source: World Bank, period averages, not live quotes.",
  ].join("\n")
}
