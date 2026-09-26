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
