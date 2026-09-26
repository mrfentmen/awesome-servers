/**
 * PVGIS client, keyless.
 * European Commission solar data: PV yield, irradiation, typical weather and hourly series.
 */

export class PvgisError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PvgisError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = "mrfentmen-pvgis-mcp/1.0"
const BASE = "https://re.jrc.ec.europa.eu/api/v5_3"

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

const MONTH_DAYS = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

export interface MonthlyPv {
  month: number
  E_m?: number
  E_d?: number
  "H(i)_m"?: number
  "H(i)_d"?: number
  SD_m?: number
}

export interface PvTotals {
  E_d?: number
  E_m?: number
  E_y?: number
  "H(i)_d"?: number
  "H(i)_m"?: number
  "H(i)_y"?: number
  SD_m?: number
  SD_y?: number
  l_total?: number
}

export interface PvResponse {
  inputs?: {
    location?: { latitude: number; longitude: number; elevation: number }
    meteo_data?: { radiation_db: string; year_min: number; year_max: number }
    mounting_system?: {
      fixed?: {
        slope?: { value: number; optimal: boolean }
        azimuth?: { value: number; optimal: boolean }
      }
    }
    pv_module?: { peak_power: number; system_loss: number }
  }
  outputs?: {
    monthly?: { fixed?: MonthlyPv[] }
    totals?: { fixed?: PvTotals }
  }
}

export interface HourlyRow {
  time?: string
  "time(UTC)"?: string
  "G(i)"?: number
  "G(h)"?: number
  "Gb(n)"?: number
  "Gd(h)"?: number
  "H_sun"?: number
  T2m?: number
  RH?: number
  WS10m?: number
  WD10m?: number
  Int?: number
  SP?: number
}

export interface SeriesResponse {
  outputs?: { hourly?: HourlyRow[] }
}

export interface TmyResponse {
  outputs?: { tmy_hourly?: HourlyRow[]; months_selected?: Array<{ month: number; year: number }> }
}

async function getJson<T>(path: string, timeoutMs: number): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (e) {
    throw new PvgisError(`Could not reach PVGIS: ${errorMessage(e)}`)
  }
  if (res.status === 400) {
    const body = (await res.text()).slice(0, 300)
    throw new PvgisError(`PVGIS rejected the request: ${body}`)
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 200)
    throw new PvgisError(`PVGIS returned HTTP ${res.status}: ${body}`)
  }
  const raw = (await res.text()).slice(0, 4_000_000)
  try {
    return JSON.parse(raw) as T
  } catch {
    throw new PvgisError("PVGIS returned a non-JSON response.")
  }
}

export interface Location {
  lat: number
  lon: number
}

export function parseLocation(lat: string, lon: string): Location {
  const la = Number.parseFloat(lat)
  const lo = Number.parseFloat(lon)
  if (!Number.isFinite(la) || la < -90 || la > 90) {
    throw new PvgisError(`Latitude must be between -90 and 90, got "${lat}". PVGIS covers Europe, Africa and Asia.`)
  }
  if (!Number.isFinite(lo) || lo < -180 || lo > 180) {
    throw new PvgisError(`Longitude must be between -180 and 180, got "${lon}".`)
  }
  return { lat: la, lon: lo }
}

function number(value: number | undefined, fallback: number, min: number, max: number, label: string): number {
  if (value === undefined || !Number.isFinite(value)) return fallback
  if (value < min || value > max) {
    throw new PvgisError(`${label} must be between ${min} and ${max}, got ${value}.`)
  }
  return value
}

function pvQuery(
  loc: Location,
  peakPower: number,
  loss: number,
  angle: number | undefined,
  aspect: number | undefined
): string {
  const q = new URLSearchParams({
    lat: String(loc.lat),
    lon: String(loc.lon),
    peakpower: String(peakPower),
    loss: String(loss),
    outputformat: "json",
  })
  if (angle === undefined) {
    q.set("optimalangles", "1")
  } else {
    q.set("angle", String(angle))
    q.set("aspect", String(aspect ?? 0))
  }
  return q.toString()
}

export async function pvYield(
  lat: string,
  lon: string,
  peakPower = 1,
  loss = 14,
  angle?: number,
  aspect?: number
): Promise<PvResponse> {
  const loc = parseLocation(lat, lon)
  const power = number(peakPower, 1, 0.05, 100000, "Peak power (kWp)")
  const systemLoss = number(loss, 14, 0, 99, "System loss (%)")
  const tilt = angle === undefined ? undefined : number(angle, 30, 0, 90, "Panel angle (degrees)")
  const azimuth = aspect === undefined ? undefined : number(aspect, 0, -180, 180, "Panel aspect (degrees)")
  return getJson<PvResponse>(`/PVcalc?${pvQuery(loc, power, systemLoss, tilt, azimuth)}`, 90000)
}

function monthly(rows: MonthlyPv[]): string {
  return rows
    .map((r) => {
      const name = (MONTHS[r.month - 1] ?? `Month ${r.month}`).padEnd(10)
      const energy = typeof r.E_m === "number" ? `${r.E_m.toFixed(1)} kWh` : "n/a"
      const poa = typeof r["H(i)_m"] === "number" ? `${r["H(i)_m"].toFixed(1)} kWh/m2` : ""
      return `  ${name} ${energy.padStart(12)}   ${poa}`
    })
    .join("\n")
}

function systemLine(data: PvResponse): string {
  const slope = data.inputs?.mounting_system?.fixed?.slope
  const azimuth = data.inputs?.mounting_system?.fixed?.azimuth
  const bits: string[] = []
  if (slope) bits.push(`tilt ${slope.value}deg${slope.optimal ? " (optimal)" : ""}`)
  if (azimuth) bits.push(`azimuth ${azimuth.value}deg${azimuth.optimal ? " (south-facing)" : ""}`)
  const module_ = data.inputs?.pv_module
  if (module_) bits.push(`${module_.peak_power} kWp, ${module_.system_loss}% losses`)
  return bits.join(" · ")
}

export function formatPvYield(data: PvResponse, loc: Location): string {
  const rows = data.outputs?.monthly?.fixed
  const totals = data.outputs?.totals?.fixed
  if (!rows || rows.length === 0) throw new PvgisError("PVGIS returned no monthly output.")
  const best = [...rows].filter((r) => typeof r.E_m === "number").sort((a, b) => (b.E_m ?? 0) - (a.E_m ?? 0))[0]
  const worst = [...rows].filter((r) => typeof r.E_m === "number").sort((a, b) => (a.E_m ?? 0) - (b.E_m ?? 0))[0]
  const lines = [
    `PV output for ${loc.lat}, ${loc.lon}`,
    systemLine(data),
    "",
    "Month      energy        plane-of-array irradiation",
    monthly(rows),
    "",
  ]
  if (totals) {
    lines.push(
      `Yearly total      ${totals.E_y?.toFixed(0)} kWh`,
      `Daily average     ${totals.E_d?.toFixed(2)} kWh`,
      `Irradiation       ${totals["H(i)_y"]?.toFixed(0)} kWh/m2/year`,
      `System losses     ${totals.l_total?.toFixed(1) ?? "n/a"}%`
    )
  }
  if (best && worst) {
    lines.push(
      "",
      `Best month   ${MONTHS[best.month - 1]} at ${best.E_m?.toFixed(0)} kWh`,
      `Worst month  ${MONTHS[worst.month - 1]} at ${worst.E_m?.toFixed(0)} kWh`
    )
  }
  return lines.join("\n")
}

export async function radiation(lat: string, lon: string, angle?: number, aspect?: number): Promise<string> {
  const data = await pvYield(lat, lon, 1, 14, angle, aspect)
  const rows = data.outputs?.monthly?.fixed
  const totals = data.outputs?.totals?.fixed
  if (!rows) throw new PvgisError("PVGIS returned no irradiation data.")
  const lines = rows.map((r) => {
    const name = (MONTHS[r.month - 1] ?? `Month ${r.month}`).padEnd(10)
    const poa = typeof r["H(i)_m"] === "number" ? `${r["H(i)_m"].toFixed(1)} kWh/m2` : "n/a"
    const day = typeof r["H(i)_d"] === "number" ? `${r["H(i)_d"].toFixed(2)} kWh/m2/day` : ""
    const spread = typeof r.SD_m === "number" ? `± ${r.SD_m.toFixed(1)}` : ""
    return `  ${name} ${poa.padStart(14)}  ${day.padEnd(22)} ${spread}`
  })
  return [
    `Solar irradiation on the panel plane at ${data.inputs?.location?.latitude}, ${data.inputs?.location?.longitude}`,
    systemLine(data),
    "",
    "Month      in-plane       per day                year-to-year spread",
    ...lines,
    "",
    `Yearly total  ${totals?.["H(i)_y"]?.toFixed(0)} kWh/m2 (${totals?.["H(i)_d"]?.toFixed(2)} kWh/m2 per day)`,
    `Database      ${data.inputs?.meteo_data?.radiation_db ?? "?"} ${data.inputs?.meteo_data?.year_min ?? ""}-${data.inputs?.meteo_data?.year_max ?? ""}`,
  ].join("\n")
}

export async function hourlyOutput(
  lat: string,
  lon: string,
  year?: number,
  peakPower = 1,
  loss = 14,
  angle?: number
): Promise<string> {
  const loc = parseLocation(lat, lon)
  const y = number(year, new Date().getUTCFullYear() - 1, 2005, new Date().getUTCFullYear(), "Year")
  const power = number(peakPower, 1, 0.05, 100000, "Peak power (kWp)")
  const systemLoss = number(loss, 14, 0, 99, "System loss (%)")
  const q = new URLSearchParams({
    lat: String(loc.lat),
    lon: String(loc.lon),
    startyear: String(y),
    endyear: String(y),
    peakpower: String(power),
    loss: String(systemLoss),
    outputformat: "json",
  })
  if (angle !== undefined) {
    q.set("angle", String(number(angle, 30, 0, 90, "Panel angle (degrees)")))
    q.set("aspect", "0")
  }
  const data = await getJson<SeriesResponse>(`/seriescalc?${q.toString()}`, 120000)
  const rows = data.outputs?.hourly ?? []
  if (rows.length === 0) throw new PvgisError("PVGIS returned no hourly rows.")
  const perMonth = new Map<number, { sum: number; sun: number; n: number; temp: number }>()
  for (const r of rows) {
    const stamp = r.time ?? r["time(UTC)"] ?? ""
    const month = Number(stamp.slice(4, 6))
    if (!month) continue
    const bucket = perMonth.get(month) ?? { sum: 0, sun: 0, n: 0, temp: 0 }
    bucket.sum += r["G(i)"] ?? 0
    bucket.sun += (r["H_sun"] ?? 0) > 0 ? 1 : 0
    bucket.temp += r.T2m ?? 0
    bucket.n += 1
    perMonth.set(month, bucket)
  }
  const lines = [...perMonth.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([m, b]) => {
      const name = (MONTHS[m - 1] ?? `Month ${m}`).padEnd(10)
      const avg = b.n ? b.sum / b.n : 0
      const temp = b.n ? b.temp / b.n : 0
      return `  ${name} ${avg.toFixed(0).padStart(5)} W/m2 avg   ${String(b.sun).padStart(4)} sun hours   ${temp.toFixed(1)} °C avg`
    })
  const totalSun = [...perMonth.values()].reduce((acc, b) => acc + b.sun, 0)
  return [
    `Hourly PV series for ${loc.lat}, ${loc.lon} in ${y} (${rows.length} hours)`,
    "",
    "Month      irradiance        daylight       temperature",
    ...lines,
    "",
    `Sunlight hours in the year: ${totalSun}`,
  ].join("\n")
}

export async function typicalWeather(lat: string, lon: string): Promise<string> {
  const loc = parseLocation(lat, lon)
  const data = await getJson<TmyResponse>(
    `/tmy?lat=${loc.lat}&lon=${loc.lon}&outputformat=json`,
    120000
  )
  const rows = data.outputs?.tmy_hourly ?? []
  if (rows.length === 0) throw new PvgisError("PVGIS returned no typical-year data.")
  const buckets = new Map<number, { g: number; temp: number; rh: number; wind: number; n: number }>()
  for (const r of rows) {
    const stamp = r["time(UTC)"] ?? r.time ?? ""
    const month = Number(stamp.slice(4, 6))
    if (!month) continue
    const b = buckets.get(month) ?? { g: 0, temp: 0, rh: 0, wind: 0, n: 0 }
    b.g += r["G(h)"] ?? 0
    b.temp += r.T2m ?? 0
    b.rh += r.RH ?? 0
    b.wind += r.WS10m ?? 0
    b.n += 1
    buckets.set(month, b)
  }
  const lines = [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([m, b]) => {
      const name = (MONTHS[m - 1] ?? `Month ${m}`).padEnd(10)
      const kwh = b.n ? ((b.g / b.n) * 24 * (MONTH_DAYS[m - 1] ?? 30)) / 1000 : 0
      return `  ${name} ${(b.temp / b.n).toFixed(1).padStart(5)} °C   ${(b.rh / b.n).toFixed(0).padStart(3)}% RH   ${(b.wind / b.n).toFixed(1).padStart(4)} m/s wind   ${kwh.toFixed(0).padStart(4)} kWh/m2`
    })
  const years = data.outputs?.months_selected ?? []
  return [
    `Typical meteorological year at ${loc.lat}, ${loc.lon}`,
    "",
    "Month      temperature    humidity   wind speed   global irradiation",
    ...lines,
    "",
    `Built from ${rows.length} hourly records${years.length ? `, months drawn from ${Math.min(...years.map((m) => m.year))}-${Math.max(...years.map((m) => m.year))}` : ""}.`,
  ].join("\n")
}

export async function systemSummary(
  lat: string,
  lon: string,
  peakPower = 4,
  loss = 14,
  angle?: number
): Promise<string> {
  const loc = parseLocation(lat, lon)
  const power = number(peakPower, 4, 0.05, 100000, "Peak power (kWp)")
  const data = await pvYield(lat, lon, power, loss, angle)
  const totals = data.outputs?.totals?.fixed
  if (!totals?.E_y) throw new PvgisError("PVGIS returned no yearly total.")
  const perKwp = totals.E_y / power
  const capacityFactor = totals.E_y / (power * 8760)
  const co2 = totals.E_y * 0.4
  const homes = totals.E_y / 10700
  const km = Math.sqrt((power * 4) / 1000)
  return [
    `System summary for ${loc.lat}, ${loc.lon}`,
    systemLine(data),
    "",
    `  yearly output      ${totals.E_y.toFixed(0)} kWh`,
    `  yield per kWp      ${perKwp.toFixed(0)} kWh/kWp`,
    `  capacity factor    ${(capacityFactor * 100).toFixed(1)}%`,
    `  CO2 avoided        ${co2.toFixed(0)} kg/year (at 0.4 kg/kWh)`,
    `  equivalent homes   ${homes.toFixed(1)} (at 10 700 kWh/year)`,
    `  rough roof area    ${(power * 5).toFixed(0)} m2 for the panels`,
    `  land footprint     about ${km.toFixed(1)} x ${km.toFixed(1)} m at this density`,
    "",
    "Estimates only - shading, soiling and inverter clipping are not modelled.",
  ].join("\n")
}

export async function compareLocations(
  sites: string,
  peakPower = 1,
  loss = 14
): Promise<string> {
  const list = sites
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5)
  if (list.length === 0) throw new PvgisError("Give at least one site as 'lat,lon'.")
  const power = number(peakPower, 1, 0.05, 100000, "Peak power (kWp)")
  const results = await Promise.all(
    list.map(async (entry) => {
      const [lat, lon] = entry.split(",")
      if (!lat || !lon) throw new PvgisError(`"${entry}" is not in 'lat,lon' form.`)
      const loc = parseLocation(lat, lon)
      const data = await pvYield(lat, lon, power, loss)
      const yearly = data.outputs?.totals?.fixed?.E_y
      const irradiation = data.outputs?.totals?.fixed?.["H(i)_y"]
      return { loc, yearly: yearly ?? 0, irradiation: irradiation ?? 0 }
    })
  )
  const best = [...results].sort((a, b) => b.yearly - a.yearly)[0]
  const lines = results.map((r) => {
    const mark = r === best ? " <-- best" : ""
    return `  ${`${r.loc.lat}, ${r.loc.lon}`.padEnd(22)} ${r.yearly.toFixed(0).padStart(6)} kWh/year   ${r.irradiation.toFixed(0).padStart(5)} kWh/m2${mark}`
  })
  return [
    `PV yield for ${results.length} sites at ${power} kWp:`,
    "",
    ...lines,
    "",
    `Best site: ${best.loc.lat}, ${best.loc.lon} with ${best.yearly.toFixed(0)} kWh/year.`,
  ].join("\n")
}

export async function sizeSystem(
  lat: string,
  lon: string,
  annualKwh: number,
  loss = 14,
  angle?: number
): Promise<string> {
  const loc = parseLocation(lat, lon)
  const target = number(annualKwh, 0, 100, 10_000_000, "Target annual output (kWh)")
  const baseline = await pvYield(lat, lon, 1, loss, angle)
  const perKwp = baseline.outputs?.totals?.fixed?.E_y
  if (!perKwp) throw new PvgisError("PVGIS returned no yearly yield to size against.")
  const size = target / perKwp
  const panels = Math.ceil((size * 1000) / 400)
  const area = size * 5
  const check = await pvYield(lat, lon, Math.max(0.05, Number(size.toFixed(2))), loss, angle)
  const modelled = check.outputs?.totals?.fixed?.E_y ?? 0
  return [
    `Sizing a PV system for ${target.toFixed(0)} kWh/year at ${loc.lat}, ${loc.lon}`,
    "",
    `  yield per kWp      ${perKwp.toFixed(0)} kWh/kWp/year here`,
    `  system size        ${size.toFixed(2)} kWp`,
    `  400 W panels       about ${panels} panels`,
    `  roof area          about ${area.toFixed(1)} m2`,
    `  modelled output    ${modelled.toFixed(0)} kWh/year`,
    "",
    "Re-run with your real target if the number differs from your last electricity bill.",
  ].join("\n")
}
