const m0 = (() => {
const UA = "mrfentmen-weather-mcp/1.0 (https://github.com/mrfentmen)"
class WeatherError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(25000) })
  if (!res.ok) throw new WeatherError(`API error ${res.status}`)
  return (await res.json()) as T
}

async function forecast(args: { lat?: number; lon?: number }): Promise<string> {
  const lat = args.lat ?? 0
  const lon = args.lon ?? 0
  if (!lat && !lon) throw new WeatherError("Provide lat and lon")
  const points = await get<any>(`https://api.weather.gov/points/${lat},${lon}`)
  const fc = await get<any>(points.properties?.forecast)
  const periods = (fc.properties?.periods ?? []).slice(0, 12)
  return `Forecast for ${points.properties?.relativeLocation?.properties?.city ?? ""}, ${points.properties?.relativeLocation?.properties?.state ?? ""}\n${periods.map((p: any) =>
    `${p.name}: ${p.temperature}${p.temperatureUnit} ${p.shortForecast}\n  ${p.detailedForecast.slice(0, 140)}`
  ).join("\n")}`
}

async function earthquakes(args: { days?: number }): Promise<string> {
  const days = args.days === 7 ? "all_week" : "all_day"
  const d = await get<any>(`https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/${days}.geojson`)
  const rows = (d.features ?? []).slice(0, 20)
  return `Recent earthquakes (${days === "all_week" ? "week" : "day"}): ${d.metadata?.count ?? 0} total\n${rows.map((f: any) => {
    const p = f.properties ?? {}
    return `${p.mag ?? "?"}M | ${p.place ?? ""} | ${new Date(p.time ?? 0).toISOString().slice(0, 16)}`
  }).join("\n")}`
}

async function femaDisasters(args: { limit?: number }): Promise<string> {
  const limit = Math.min(args.limit ?? 10, 25)
  const d = await get<any>(
    `https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries?$top=${limit}&$orderby=declarationDate%20desc`
  )
  const rows = (d.DisasterDeclarationsSummaries ?? [])
    .slice()
    .sort((a: any, b: any) => String(b.declarationDate ?? "").localeCompare(String(a.declarationDate ?? "")))
    .slice(0, limit)
  return rows.map((r: any) =>
    `${r.declarationDate?.slice(0, 10) ?? ""} | ${r.incidentType ?? ""} | ${r.state ?? ""}\n  ${r.declarationTitle ?? r.incidentTitle ?? ""} | ${r.femaDeclarationString ?? ""}`
  ).join("\n\n") || "No disasters found"
}

return { WeatherError, earthquakes, femaDisasters, forecast };
})();

const m1 = (() => {
const BASE = "https://api.weather.gov"
const UA = "mrfentmen-weather-alerts-mcp/1.0 (https://github.com/mrfentmen)"
class AlertError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/geo+json" }, signal: AbortSignal.timeout(25000) })
  if (!res.ok) throw new AlertError(`NWS error ${res.status}`)
  return (await res.json()) as T
}

function fmt(f: any): string {
  const p = f.properties ?? {}
  return `${p.event ?? ""} | ${p.severity ?? ""} (${p.areaDesc ?? ""})\n  ${(p.headline ?? "").slice(0, 250)}\n  ${(p.description ?? "").replace(/\s+/g, " ").slice(0, 400)}`
}

async function activeAlerts(args: { state?: string; limit?: number }): Promise<string> {
  const limit = Math.min(args.limit ?? 8, 20)
  const state = (args.state ?? "").trim().toUpperCase()
  const url = state ? `${BASE}/alerts/active?area=${state}` : `${BASE}/alerts/active`
  const d = await get<any>(url)
  const rows = (d.features ?? []).slice(0, limit)
  return `${rows.length} active alerts${state ? ` for ${state}` : ""}\n${rows.map(fmt).join("\n\n") || "None active"}`
}

async function alertsForPoint(args: { lat?: number; lon?: number }): Promise<string> {
  const lat = args.lat ?? 0
  const lon = args.lon ?? 0
  if (!lat && !lon) throw new AlertError("Provide lat and lon")
  const d = await get<any>(`${BASE}/alerts/active?point=${lat},${lon}`)
  const rows = d.features ?? []
  return `${rows.length} active alerts near ${lat}, ${lon}\n${rows.slice(0, 8).map(fmt).join("\n\n") || "None active"}`
}

return { AlertError, activeAlerts, alertsForPoint };
})();

export const AlertError = m1.AlertError;
export const WeatherError = m0.WeatherError;
export const activeAlerts = m1.activeAlerts;
export const alertsForPoint = m1.alertsForPoint;
export const earthquakes = m0.earthquakes;
export const femaDisasters = m0.femaDisasters;
export const forecast = m0.forecast;
export const m0_femaDisasters = m0.femaDisasters;
export const m0_earthquakes = m0.earthquakes;
export const m0_forecast = m0.forecast;
export const m0_WeatherError = m0.WeatherError;
export const m1_alertsForPoint = m1.alertsForPoint;
export const m1_AlertError = m1.AlertError;
export const m1_activeAlerts = m1.activeAlerts;

// ---- muxC tools:

const WX_UA = "mrfentmen-weather-mcp/1.0 (https://github.com/mrfentmen)"

class WeatherToolError extends Error {}

/** Active NWS alerts for a whole state or territory code, not just a point. */
export async function alertsForArea(args: { area?: string; limit?: number }): Promise<string> {
  const area = (args.area ?? "").trim().toUpperCase()
  if (!area) throw new WeatherToolError("Provide a two letter state or territory code, e.g. CA, TX or PR")
  if (!/^[A-Z]{2}$/.test(area)) throw new WeatherToolError("A US state or territory code is two capitals, e.g. CA")
  const limit = Math.max(1, Math.min(args.limit ?? 10, 100))
  const res = await fetch(`https://api.weather.gov/alerts/active/area/${area}`, {
    headers: { "User-Agent": WX_UA, Accept: "application/geo+json" },
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new WeatherToolError(`The National Weather Service returned ${res.status} for area ${area}`)
  const d = (await res.json()) as { features?: any[] }
  const rows: any[] = d?.features ?? []
  if (!rows.length) return `The National Weather Service has no active alerts for ${area}.`
  return `Active NWS alerts for ${area} (${rows.length} active, ${limit} shown):\n` +
    rows.slice(0, limit).map((f, i) => {
      const p = f.properties ?? {}
      return `${i + 1}. ${p.event ?? "alert"} - ${p.severity ?? "severity not reported"} / ${p.urgency ?? "urgency not reported"}\n   ${p.headline ?? "no headline"}\n   effective ${String(p.effective ?? "").slice(0, 16).replace("T", " ") || "not reported"} | expires ${String(p.expires ?? "").slice(0, 16).replace("T", " ") || "not reported"}\n   ${p.areaDesc ? `area: ${String(p.areaDesc).slice(0, 140)}` : ""}`
    })
    .join("\n")
}

/** FEMA disaster declarations filtered to one state, which the national list cannot narrow. */
export async function disastersByState(args: { state?: string; limit?: number }): Promise<string> {
  const state = (args.state ?? "").trim().toUpperCase()
  if (!state) throw new WeatherToolError("Provide a two letter state code, e.g. CA or TX")
  if (!/^[A-Z]{2}$/.test(state)) throw new WeatherToolError("A US state code is two capitals, e.g. CA")
  const limit = Math.max(1, Math.min(args.limit ?? 10, 50))
  const filter = encodeURIComponent(`state eq '${state}'`)
  const url = `https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries?$top=${limit}&$orderby=declarationDate%20desc&$filter=${filter}`
  const res = await fetch(url, { headers: { "User-Agent": WX_UA, Accept: "application/json" }, signal: AbortSignal.timeout(30000) })
  if (!res.ok) throw new WeatherToolError(`FEMA's open api returned ${res.status}`)
  const d = (await res.json()) as { DisasterDeclarationsSummaries?: any[] }
  const rows: any[] = d?.DisasterDeclarationsSummaries ?? []
  if (!rows.length) return `FEMA has no disaster declarations for ${state}.`
  return `FEMA disaster declarations in ${state} (${rows.length} returned, newest first):\n` +
    rows.map((r, i) => `${i + 1}. ${r.disasterName ?? "unnamed declaration"} (${r.declarationType ?? "type not reported"})\n   declared ${String(r.declarationDate ?? "").slice(0, 10) || "not reported"} | incident ${String(r.incidentBeginDate ?? "").slice(0, 10) || "not reported"} to ${String(r.incidentEndDate ?? "").slice(0, 10) || "ongoing"} | ${r.designationNumber ?? "no designation number"}`).join("\n")
}
