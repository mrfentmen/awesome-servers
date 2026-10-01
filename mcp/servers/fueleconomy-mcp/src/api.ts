/**
 * FuelEconomy.gov client, keyless.
 * The public REST service at /ws/rest returns XML for menus and accepts JSON for fuel prices.
 */

export class FuelError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "FuelError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = "mrfentmen-fueleconomy-mcp/1.0"
const BASE = "https://www.fueleconomy.gov/ws/rest"

async function get(path: string, accept: "xml" | "json"): Promise<string> {
  let res: Response
  try {
    res = await fetch(BASE + path, {
      headers: { "User-Agent": UA, Accept: accept === "json" ? "application/json" : "application/xml" },
      signal: AbortSignal.timeout(20000),
    })
  } catch (e) {
    throw new FuelError(`Could not reach fueleconomy.gov: ${errorMessage(e)}`)
  }
  if (res.status === 404) throw new FuelError("No such record on fueleconomy.gov.")
  if (res.status === 204 || (res.status === 200 && res.headers.get("content-length") === "0")) {
    return ""
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 200)
    throw new FuelError(`fueleconomy.gov returned HTTP ${res.status}: ${body}`)
  }
  return res.text()
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
}

/** Pull `<tag>value</tag>` pairs out of a flat XML document. */
export function xmlFields(xml: string): Record<string, string> {
  const out: Record<string, string> = {}
  const body = xml.replace(/<\?xml[^>]*\?>/, "")
  const re = /<([A-Za-z][\w]*)>([^<]*)<\/\1>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(body)) !== null) {
    if (!(m[1] in out)) out[m[1]] = decodeEntities(m[2]).trim()
  }
  return out
}

/** Pull the `<menuItem><text>..</text><value>..</value></menuItem>` rows out of a menu document. */
export function xmlMenu(xml: string): Array<{ text: string; value: string }> {
  const out: Array<{ text: string; value: string }> = []
  const re =
    /<menuItem>\s*<text>([^<]*)<\/text>\s*<value>([^<]*)<\/value>\s*<\/menuItem>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) {
    out.push({ text: decodeEntities(m[1]), value: decodeEntities(m[2]) })
  }
  return out
}

export interface Vehicle {
  id: string
  year: string
  make: string
  model: string
  transmission: string
  drive: string
  fuel: string
  cylinders: string
  displacement: string
  vehicleClass: string
  city: string
  highway: string
  combined: string
  co2: string
  annualFuelCost: string
  ghgScore: string
  feScore: string
  range: string
}

export function toVehicle(f: Record<string, string>): Vehicle {
  return {
    id: f.id ?? "?",
    year: f.year ?? "?",
    make: f.make ?? "?",
    model: f.model ?? "?",
    transmission: f.trany ?? "",
    drive: f.drive ?? "",
    fuel: f.fuelType1 ?? f.fuelType ?? "",
    cylinders: f.cylinders ?? "",
    displacement: f.displ ?? "",
    vehicleClass: f.VClass ?? "",
    city: f.city08 ?? "",
    highway: f.highway08 ?? "",
    combined: f.comb08 ?? "",
    co2: f.co2TailpipeGpm ?? "",
    annualFuelCost: f.fuelCost08 ?? "",
    ghgScore: f.ghgScore ?? "",
    feScore: f.feScore ?? "",
    range: f.range ?? f.rangeCity ?? "",
  }
}

export function formatVehicle(v: Vehicle): string {
  const lines = [
    `${v.year} ${v.make} ${v.model}`,
    `  vehicle id    ${v.id}`,
    `  fuel          ${v.fuel || "unknown"}`,
    `  transmission  ${v.transmission || "unknown"}`,
    `  engine        ${[v.displacement ? `${v.displacement}L` : "", v.cylinders ? `${v.cylinders} cyl` : ""]
      .filter(Boolean)
      .join(" ") || "unknown"}`,
    `  drive         ${v.drive || "unknown"}`,
    `  class         ${v.vehicleClass || "unknown"}`,
    `  MPG           city ${v.city || "?"} | highway ${v.highway || "?"} | combined ${v.combined || "?"}`,
    `  CO2           ${v.co2 ? `${v.co2} g/mile` : "n/a"}`,
    `  fuel cost     ${v.annualFuelCost ? `$${v.annualFuelCost}/year` : "n/a"}`,
    `  scores        smog ${v.feScore || "?"} / greenhouse ${v.ghgScore || "?"}`,
  ]
  if (v.range) lines.push(`  range         ${v.range} miles`)
  return lines.join("\n")
}

export async function listYears(): Promise<string[]> {
  return xmlMenu(await get("/vehicle/menu/year", "xml")).map((i) => i.value)
}

export async function listMakes(year: string): Promise<Array<{ text: string; value: string }>> {
  requireYear(year)
  return xmlMenu(await get(`/vehicle/menu/make?year=${encodeURIComponent(year)}`, "xml"))
}

export async function listModels(
  year: string,
  make: string
): Promise<Array<{ text: string; value: string }>> {
  requireYear(year)
  if (!make.trim()) throw new FuelError("A make is required - call list_makes for the options.")
  return xmlMenu(
    await get(`/vehicle/menu/model?year=${encodeURIComponent(year)}&make=${encodeURIComponent(make)}`, "xml")
  )
}

export async function listOptions(
  year: string,
  make: string,
  model: string
): Promise<Array<{ text: string; value: string }>> {
  requireYear(year)
  if (!make.trim() || !model.trim()) {
    throw new FuelError("Both a make and a model are required - call list_models first.")
  }
  return xmlMenu(
    await get(
      `/vehicle/menu/options?year=${encodeURIComponent(year)}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`,
      "xml"
    )
  )
}

function requireYear(year: string): void {
  if (!/^\d{4}$/.test(year.trim())) {
    throw new FuelError(`"${year}" is not a four-digit model year - call list_years for the valid range.`)
  }
}

export async function vehicleDetails(vehicleId: string): Promise<Vehicle> {
  const id = vehicleId.trim()
  if (!/^\d{1,7}$/.test(id)) {
    throw new FuelError(`"${vehicleId}" is not a vehicle id - call list_options to find one.`)
  }
  const xml = await get(`/vehicle/${id}`, "xml")
  if (!xml) throw new FuelError(`No vehicle with id ${id}.`)
  return toVehicle(xmlFields(xml))
}

export async function compareVehicles(vehicleIds: string[]): Promise<string> {
  const ids = vehicleIds.map((v) => v.trim()).filter(Boolean).slice(0, 6)
  if (ids.length === 0) throw new FuelError("Give at least one vehicle id.")
  const vehicles = await Promise.all(ids.map((id) => vehicleDetails(id)))
  if (vehicles.length === 1) return formatVehicle(vehicles[0])
  const best = vehicles
    .filter((v) => Number(v.combined) > 0)
    .sort((a, b) => Number(b.combined) - Number(a.combined))[0]
  const rows = vehicles.map((v, i) => formatVehicle(v).replace(/^/, `#${i + 1} `).replace(/\n/g, "\n   "))
  const tail = best
    ? `\n\nBest combined MPG: ${best.year} ${best.make} ${best.model} at ${best.combined} MPG.`
    : ""
  return `Comparing ${vehicles.length} vehicles:\n\n${rows.join("\n\n")}${tail}`
}

export interface FuelPrices {
  regular: string
  midgrade: string
  premium: string
  diesel: string
  e85: string
  cng: string
  lpg: string
  electric: string
}

export async function fuelPrices(): Promise<string> {
  const raw = await get("/fuelprices", "json")
  if (!raw) throw new FuelError("fueleconomy.gov returned no fuel prices right now.")
  const prices = JSON.parse(raw) as Partial<FuelPrices>
  const order: Array<[keyof FuelPrices, string]> = [
    ["regular", "Regular gasoline"],
    ["midgrade", "Midgrade gasoline"],
    ["premium", "Premium gasoline"],
    ["diesel", "Diesel"],
    ["e85", "E85"],
    ["cng", "CNG"],
    ["lpg", "LPG"],
    ["electric", "Electricity"],
  ]
  const lines = order
    .filter(([k]) => prices[k])
    .map(([k, label]) => {
      const unit = k === "electric" ? "$/kWh" : "$/gallon"
      return `  ${label.padEnd(20)} $${prices[k]} ${unit}`
    })
  return [
    "US national average fuel prices (fueleconomy.gov):",
    "",
    ...lines,
    "",
    "Updated weekly by the US Department of Energy.",
  ].join("\n")
}
// ---- batch-4 tools: running cost estimates (2026-09-27) ----
const FUEL_KEYS: Array<[RegExp, keyof FuelPrices]> = [
  [/diesel/i, "diesel"],
  [/e85|ethanol/i, "e85"],
  [/electric|electricity|ev\b/i, "electric"],
  [/premium/i, "premium"],
  [/midgrade/i, "midgrade"],
  [/cng/i, "cng"],
  [/lpg|propane/i, "lpg"],
]

function fuelKey(fuel: string): keyof FuelPrices {
  for (const [pattern, key] of FUEL_KEYS) {
    if (pattern.test(fuel)) return key
  }
  return "regular"
}

async function nationalPrices(): Promise<Partial<FuelPrices>> {
  const raw = await get("/fuelprices", "json")
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Partial<FuelPrices>
  } catch {
    return {}
  }
}

const clampMiles = (value: number | undefined) =>
  Math.min(Math.max(Number(value ?? 12000) || 12000, 500), 100000)

/** Annual fuel cost for one vehicle at a chosen mileage, from the EPA record. */
export async function runningCost(args: { vehicle_id: string; miles_per_year?: number; fuel_price?: number }): Promise<string> {
  const vehicle = await vehicleDetails(args.vehicle_id)
  const miles = clampMiles(args.miles_per_year)
  const mpg = Number(vehicle.combined)
  if (!Number.isFinite(mpg) || mpg <= 0) {
    throw new FuelError(`${vehicle.year} ${vehicle.make} ${vehicle.model} has no combined MPG in the EPA record, so cost cannot be estimated.`)
  }
  const key = fuelKey(vehicle.fuel)
  const givenPrice = Number(args.fuel_price)
  const useNational = !Number.isFinite(givenPrice)
  const price = useNational ? Number((await nationalPrices())[key]) : givenPrice
  if (!Number.isFinite(price) || price <= 0) {
    throw new FuelError("No usable fuel price: pass fuel_price, or the national average for this fuel is unavailable.")
  }
  const gallons = miles / mpg
  const cost = gallons * price
  const co2 = Number(vehicle.co2)
  const unit = key === "electric" ? "$/kWh" : "$/gallon"
  return [
    `Running cost for ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    `EPA combined ${vehicle.combined} MPG over ${miles.toLocaleString()} miles/year`,
    useNational
      ? `Fuel price: $${price} ${unit} (national average for ${vehicle.fuel || "regular"})`
      : `Fuel price: $${price}/gallon as given`,
    `Fuel used: ${gallons.toFixed(1)} ${key === "electric" ? "kWh" : "gallons"}/year | cost $${cost.toFixed(0)}/year ($${(cost / miles).toFixed(3)}/mile)`,
    Number.isFinite(co2) && co2 > 0 ? `Tailpipe CO2 at this mileage: ${((co2 * miles) / 1000000).toFixed(2)} tonnes/year` : "",
    "Estimate only - real efficiency and local prices differ.",
  ].filter(Boolean).join("\n")
}

/** Ranks two to six vehicles by estimated annual fuel cost at the same mileage. */
export async function compareCosts(args: { vehicle_ids: string; miles_per_year?: number; fuel_price?: number }): Promise<string> {
  const ids = (args.vehicle_ids ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 6)
  if (ids.length < 2) throw new FuelError("Give two to six vehicle ids, comma separated.")
  const miles = clampMiles(args.miles_per_year)
  const givenPrice = Number(args.fuel_price)
  const prices = Number.isFinite(givenPrice) ? null : await nationalPrices()
  const rows: Array<{ label: string; cost: number; mpg: number; fuel: string; co2: number }> = []
  for (const id of ids) {
    const v = await vehicleDetails(id)
    const mpg = Number(v.combined)
    const price = Number.isFinite(givenPrice) ? givenPrice : Number(prices?.[fuelKey(v.fuel)])
    const cost = mpg > 0 && Number.isFinite(price) && price > 0 ? (miles / mpg) * price : NaN
    rows.push({ label: `${v.year} ${v.make} ${v.model}`, cost, mpg, fuel: v.fuel || "regular", co2: Number(v.co2) })
  }
  const ranked = [...rows].filter((r) => Number.isFinite(r.cost)).sort((a, b) => a.cost - b.cost)
  if (!ranked.length) throw new FuelError("None of those vehicles has both an MPG figure and a usable fuel price.")
  const worst = ranked[ranked.length - 1]
  const best = ranked[0]
  return [
    `Annual fuel cost at ${miles.toLocaleString()} miles/year (${givenPrice ? `$${givenPrice}/gallon` : "national average prices"}):`,
    ...ranked.map((r, i) => `${i + 1}. ${r.label} | ${r.mpg} MPG | $${r.cost.toFixed(0)}/year${Number.isFinite(r.co2) && r.co2 > 0 ? ` | ${((r.co2 * miles) / 1000000).toFixed(2)} t CO2/year` : ""}`),
    "",
    ranked.length > 1
      ? `Cheapest to run: ${best.label} at $${best.cost.toFixed(0)}/year, $${(worst.cost - best.cost).toFixed(0)}/year less than ${worst.label}.`
      : "",
    "Estimates from EPA combined MPG; real-world mileage varies.",
  ].filter(Boolean).join("\n")
}

// ---- muxG tools:
const NHTSA = "https://api.nhtsa.gov"

type NhtsaRow = Record<string, unknown>

interface NhtsaList<T> {
  Count?: number
  results?: T[]
}

interface RecallRow {
  NHTSACampaignNumber?: string
  Component?: string
  Summary?: string
  Consequence?: string
  Remedy?: string
  ReportReceivedDate?: string
  parkIt?: boolean
  overTheaterUpdate?: boolean
  overTheAirUpdate?: boolean
}

interface ComplaintRow {
  odiNumber?: string
  components?: string
  summary?: string
  dateComplaintFiled?: string
  crash?: boolean
  fire?: boolean
  numberOfDeaths?: number
  numberOfInjuries?: number
  products?: string
}

function vehicleWords(year: number, make: string, model: string): { year: number; make: string; model: string } {
  const y = Math.floor(Number(year))
  if (!Number.isFinite(y) || y < 1900 || y > 2100) throw new Error(`"${year}" is not a plausible model year.`)
  const m = (make ?? "").trim()
  const d = (model ?? "").trim()
  if (!m || !/^[a-z0-9 .'-]{2,40}$/i.test(m)) throw new Error("Make must be 2-40 letters, e.g. honda.")
  if (!d || !/^[a-z0-9 .'-]{1,40}$/i.test(d)) throw new Error("Model must be 1-40 letters, e.g. civic.")
  return { year: y, make: m, model: d }
}

async function nhtsaJson<T>(path: string): Promise<T> {
  const url = `${NHTSA}${path}`
  let res: Response
  try {
    res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) })
  } catch (e) {
    throw new Error(`Network error from NHTSA: ${(e as Error).message}`)
  }
  if (!res.ok) throw new Error(`NHTSA returned ${res.status} for ${path}`)
  const body = await res.text()
  if (!body.trim()) throw new Error("NHTSA returned an empty body.")
  return JSON.parse(body) as T
}

export interface ModelRecallsArgs {
  year: number
  make: string
  model: string
  limit: number
}

export interface ModelComplaintsArgs {
  year: number
  make: string
  model: string
  limit: number
}

