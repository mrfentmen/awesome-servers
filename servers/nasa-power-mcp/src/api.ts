const BASE = "https://power.larc.nasa.gov/api/temporal/daily/point"
const UA = "mrfentmen-nasa-power-mcp/1.0 (https://github.com/mrfentmen)"
const KNOWN = ["T2M", "T2M_MIN", "T2M_MAX", "PRECTOTCORR", "ALLSKY_SFC_SW_DWN", "ALLSKY_SRF_ALB", "WS2M", "RH2M", "PS"]
export class NasaPowerError extends Error {}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, "")
}

export async function daily(args: {
  latitude?: number
  longitude?: number
  parameters?: string
  start?: string
  end?: string
}): Promise<string> {
  const lat = Number(args.latitude)
  const lon = Number(args.longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new NasaPowerError("Provide valid latitude and longitude")
  const params = (args.parameters ?? "T2M,PRECTOTCORR,ALLSKY_SFC_SW_DWN")
    .split(",")
    .map((p) => p.trim().toUpperCase())
    .filter(Boolean)
  const bad = params.filter((p) => !KNOWN.includes(p))
  if (bad.length) throw new NasaPowerError(`Unknown parameters: ${bad.join(", ")}`)
  const now = new Date()
  const endDate = new Date(now)
  endDate.setDate(endDate.getDate() + 7)
  const start = (args.start ?? ymd(new Date(now.getTime() - 7 * 86400000))).trim()
  const end = (args.end ?? ymd(endDate)).trim()
  if (!/^\d{8}$/.test(start) || !/^\d{8}$/.test(end)) throw new NasaPowerError("Dates must be YYYYMMDD")
  const url = `${BASE}?parameters=${encodeURIComponent(params.join(","))}&community=RE&longitude=${lon}&latitude=${lat}&start=${start}&end=${end}&format=JSON`
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(45000),
  })
  if (!res.ok) throw new NasaPowerError(`NASA POWER returned HTTP ${res.status}`)
  const d = (await res.json()) as any
  const p = d?.properties?.parameter ?? {}
  const dates = Object.keys(p?.[params[0]] ?? {}).sort()
  if (!dates.length) throw new NasaPowerError("No data returned for those dates")
  const header = `NASA POWER daily at ${lat.toFixed(2)}, ${lon.toFixed(2)} (${params.join(", ")})`
  const rows = dates.map((dt) => {
    const vals = params.map((prm) => {
      const v = p?.[prm]?.[dt]
      return `${prm}=${v != null ? Number(v).toFixed(2) : "n/a"}`
    })
    return `${dt}: ${vals.join(" | ")}`
  })
  const shown = rows.length > 14 ? [...rows.slice(0, 14), `... and ${rows.length - 14} more days`] : rows
  return header + "\n" + shown.join("\n")
}

// ---- muxC tools:

const POWER_ROOT = "https://power.larc.nasa.gov/api/temporal"
const POWER_UA = "mrfentmen-nasa-power-mcp/1.0 (https://github.com/mrfentmen)"
// NASA fills absent values with -999 rather than omitting them, so anything at
// or below that is missing data, not a measurement.
const POWER_FILL = -999

async function powerGet(path: string, query: Record<string, string>): Promise<any> {
  const url = `${POWER_ROOT}/${path}?${new URLSearchParams({ community: "RE", format: "JSON", ...query }).toString()}`
  const res = await fetch(url, {
    headers: { "User-Agent": POWER_UA, Accept: "application/json" },
    signal: AbortSignal.timeout(45000),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new NasaPowerError(`NASA POWER returned HTTP ${res.status}${body ? `: ${body.slice(0, 200)}` : ""}`)
  }
  return (await res.json()) as any
}

function checkKnown(params: string[]): string[] {
  const bad = params.filter((p) => !KNOWN.includes(p))
  if (bad.length) throw new NasaPowerError(`Unknown parameters: ${bad.join(", ")}. Known: ${KNOWN.join(", ")}`)
  return params
}

function coordinates(args: { latitude?: number; longitude?: number }): { lat: number; lon: number } {
  const lat = Number(args.latitude)
  const lon = Number(args.longitude)
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) throw new NasaPowerError("Provide a latitude between -90 and 90")
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) throw new NasaPowerError("Provide a longitude between -180 and 180")
  return { lat, lon }
}

function shown(value: unknown): string {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= POWER_FILL) return "not reported"
  return n.toFixed(2)
}

/** A bounding box rather than a single point, so you can see a gradient. */
export async function regional(args: { latitude_min?: number; latitude_max?: number; longitude_min?: number; longitude_max?: number; parameters?: string; start?: string; end?: string; limit?: number }): Promise<string> {
  const latMin = Number(args.latitude_min)
  const latMax = Number(args.latitude_max)
  const lonMin = Number(args.longitude_min)
  const lonMax = Number(args.longitude_max)
  for (const [v, lo, hi, name] of [[latMin, -90, 90, "latitude_min"], [latMax, -90, 90, "latitude_max"], [lonMin, -180, 180, "longitude_min"], [lonMax, -180, 180, "longitude_max"]] as const) {
    if (!Number.isFinite(v) || v < lo || v > hi) throw new NasaPowerError(`Provide ${name} between ${lo} and ${hi}`)
  }
  if (latMin > latMax) throw new NasaPowerError("latitude_min must not be above latitude_max")
  if (lonMin > lonMax) throw new NasaPowerError("longitude_min must not be right of longitude_max")
  // POWER's regional endpoint refuses boxes under 2 degrees, so say that here
  // rather than passing the request on and surfacing a 422.
  if (latMax - latMin < 2 || lonMax - lonMin < 2) {
    throw new NasaPowerError("NASA POWER's regional endpoint needs a box at least 2 degrees on each side, so widen latitude_min/latitude_max and longitude_min/longitude_max")
  }
  const params = checkKnown((args.parameters ?? "T2M").split(",").map((p) => p.trim().toUpperCase()).filter(Boolean))
  const now = new Date()
  const fmt = (d: Date): string => d.toISOString().slice(0, 10).replace(/-/g, "")
  const end = (args.end ?? fmt(now)).trim()
  const start = (args.start ?? fmt(new Date(now.getTime() - 5 * 86400000))).trim()
  if (!/^\d{8}$/.test(start) || !/^\d{8}$/.test(end)) throw new NasaPowerError("Dates must be YYYYMMDD")
  const limit = Math.max(1, Math.min(args.limit ?? 20, 100))
  const d = await powerGet("daily/regional", {
    parameters: params.join(","),
    "longitude-min": String(lonMin),
    "longitude-max": String(lonMax),
    "latitude-min": String(latMin),
    "latitude-max": String(latMax),
    start,
    end,
  })
  const cells: any[] = Array.isArray(d?.features) ? d.features : []
  if (!cells.length) throw new NasaPowerError("NASA POWER returned no cells for that box")
  // POWER's daily regional feed lags, so pick the last date any cell actually
  // carries rather than the last date in the payload.
  const dates = new Set<string>()
  for (const cell of cells) {
    for (const stamp of Object.keys(cell?.properties?.parameter?.[params[0]] ?? {})) dates.add(stamp)
  }
  const sorted = [...dates].sort()
  let useDate = sorted[sorted.length - 1]
  if (useDate) {
    while (useDate && !cells.some((c) => params.some((prm) => Number(c?.properties?.parameter?.[prm]?.[useDate]) > POWER_FILL))) {
      sorted.pop()
      useDate = sorted[sorted.length - 1]
    }
  }
  if (!useDate) throw new NasaPowerError(`Every date NASA POWER returned for that box is still the -999 fill value (${start}-${end}), so nothing has been published yet`)
  const rows = cells.map((cell) => {
    const [lon, lat, elev] = cell?.geometry?.coordinates ?? []
    return `  ${Number(lat).toFixed(2)}, ${Number(lon).toFixed(2)} (${Number(elev ?? 0).toFixed(0)} m): ${params.map((prm) => `${prm}=${shown(cell?.properties?.parameter?.[prm]?.[useDate])}`).join(" | ")} on ${useDate}`
  })
  return [
    `NASA POWER regional grid ${params.join(", ")}`,
    `Box: lat ${latMin}-${latMax}, lon ${lonMin}-${lonMax} | ${cells.length} cells${cells.length > limit ? `, showing ${limit}` : ""} | dates ${start}-${end} (latest value per cell)`,
    ...rows.slice(0, limit),
  ].join("\n")
}
