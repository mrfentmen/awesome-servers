/**
 * Open-Meteo Air Quality API — keyless. Current and forecast particulate
 * matter, trace gases, European and US AQI, plus pollen (Europe).
 */
const BASE = "https://air-quality-api.open-meteo.com/v1/air-quality"

export class AirQualityError extends Error {}

async function getJson(url: string, timeoutMs = 25000): Promise<any> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "user-agent": "air-quality-mcp", accept: "application/json" },
    })
    if (!res.ok) throw new AirQualityError(`Open-Meteo responded ${res.status}`)
    const text = await res.text()
    try {
      return JSON.parse(text)
    } catch {
      throw new AirQualityError("Open-Meteo returned malformed JSON")
    }
  } catch (e) {
    if (e instanceof AirQualityError) throw e
    if ((e as Error).name === "AbortError") throw new AirQualityError("Open-Meteo request timed out")
    throw new AirQualityError(`Open-Meteo request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

function coords(latitude: number, longitude: number): string {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) throw new AirQualityError("latitude must be between -90 and 90")
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new AirQualityError("longitude must be between -180 and 180")
  return `latitude=${latitude}&longitude=${longitude}&timezone=auto`
}

/** Official European AQI bands. */
function euBand(aqi: number): string {
  if (!Number.isFinite(aqi)) return "unknown"
  if (aqi <= 20) return "good"
  if (aqi <= 40) return "fair"
  if (aqi <= 60) return "moderate"
  if (aqi <= 80) return "poor"
  if (aqi <= 100) return "very poor"
  return "extremely poor"
}

const fmt = (v: unknown, unit = ""): string => (typeof v === "number" ? `${Math.round(v * 10) / 10}${unit}` : "n/a")

const CURRENT = "pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,european_aqi,us_aqi"

export async function currentAirQuality(latitude: number, longitude: number): Promise<string> {
  const d = await getJson(`${BASE}?${coords(latitude, longitude)}&current=${CURRENT}`)
  const c = d?.current ?? {}
  const eu = Number(c.european_aqi)
  return [
    `Air quality at ${d?.latitude ?? latitude}, ${d?.longitude ?? longitude} (${d?.timezone ?? "local time"}) at ${c.time ?? "?"}:`,
    `  European AQI: ${fmt(c.european_aqi)} — ${euBand(eu)} · US AQI ${fmt(c.us_aqi)}`,
    `  PM2.5: ${fmt(c.pm2_5, " µg/m³")} · PM10: ${fmt(c.pm10, " µg/m³")}`,
    `  NO₂: ${fmt(c.nitrogen_dioxide, " µg/m³")} · O₃: ${fmt(c.ozone, " µg/m³")} · SO₂: ${fmt(c.sulphur_dioxide, " µg/m³")} · CO: ${fmt(c.carbon_monoxide, " µg/m³")}`,
  ].join("\n")
}

export async function airQualityForecast(latitude: number, longitude: number, hours = 24): Promise<string> {
  if (!Number.isInteger(hours) || hours < 3 || hours > 120) throw new AirQualityError("hours must be between 3 and 120")
  const days = Math.max(1, Math.min(5, Math.ceil(hours / 24)))
  const d = await getJson(`${BASE}?${coords(latitude, longitude)}&current=european_aqi&hourly=european_aqi,pm2_5,pm10&forecast_days=${days}`)
  const h = d?.hourly ?? {}
  const now: string = String(d?.current?.time ?? "")
  const times: string[] = (h.time ?? []).filter((t: string) => !now || t >= now)
  const allTimes: string[] = h.time ?? []
  const offset = now ? Math.max(0, allTimes.indexOf(times[0] ?? "")) : 0
  const aqi: number[] = (h.european_aqi ?? []).slice(offset)
  const pm25: number[] = (h.pm2_5 ?? []).slice(offset)
  const rows = times.slice(0, Math.min(hours, times.length)).map((t, i) => ({ t, aqi: aqi[i], pm25: pm25[i] }))
  if (rows.length === 0) throw new AirQualityError("Open-Meteo returned no hourly air quality data for that point")
  const values = rows.map((r) => r.aqi).filter((v) => typeof v === "number")
  const peak = rows.reduce((a, b) => (Number(b.aqi) > Number(a.aqi) ? b : a), rows[0])
  return [
    `Air quality forecast at ${d?.latitude ?? latitude}, ${d?.longitude ?? longitude} (${rows.length} hours):`,
    `  Range: ${fmt(Math.min(...values))} – ${fmt(Math.max(...values))} European AQI · peak ${peak.t} (${fmt(peak.aqi)} — ${euBand(Number(peak.aqi))})`,
    "",
    ...rows.map((r) => `${r.t} · AQI ${fmt(r.aqi)} (${euBand(Number(r.aqi))}) · PM2.5 ${fmt(r.pm25, " µg/m³")}`),
  ].join("\n")
}

export async function pollutantDetail(latitude: number, longitude: number): Promise<string> {
  const d = await getJson(`${BASE}?${coords(latitude, longitude)}&current=${CURRENT}`)
  const c = d?.current ?? {}
  const u = d?.current_units ?? {}
  const lines = Object.keys(u)
    .filter((k) => k !== "time" && k !== "interval")
    .map((k) => `${k}: ${fmt(c[k])} ${u[k] || ""}`.trim())
  return [
    `Pollutant detail at ${d?.latitude ?? latitude}, ${d?.longitude ?? longitude} (${c.time ?? "?"}):`,
    "",
    ...lines,
    "",
    `European AQI ${fmt(c.european_aqi)} — ${euBand(Number(c.european_aqi))}`,
  ].join("\n")
}

export async function pollenForecast(latitude: number, longitude: number, hours = 24): Promise<string> {
  if (latitude < -60 || latitude > 75) throw new AirQualityError("pollen data is only modelled for Europe and parts of North America")
  if (!Number.isInteger(hours) || hours < 3 || hours > 120) throw new AirQualityError("hours must be between 3 and 120")
  const days = Math.max(1, Math.min(5, Math.ceil(hours / 24)))
  const vars = "alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen"
  const d = await getJson(`${BASE}?${coords(latitude, longitude)}&current=european_aqi&hourly=${vars}&forecast_days=${days}`)
  const h = d?.hourly ?? {}
  const now: string = String(d?.current?.time ?? "")
  const allTimes: string[] = h.time ?? []
  const offset = now ? Math.max(0, allTimes.findIndex((t) => t >= now)) : 0
  const times: string[] = allTimes.slice(offset)
  if (times.length === 0) throw new AirQualityError("Open-Meteo returned no pollen data for that point")
  const rows = times.slice(0, Math.min(hours, times.length)).map((t, i) => {
    const idx = i + offset
    const vals = vars.split(",").map((v) => Number((h as any)[v]?.[idx]) || 0)
    return { t, total: vals.reduce((a, b) => a + b, 0), list: vals }
  })
  const peak = rows.reduce((a, b) => (b.total > a.total ? b : a), rows[0])
  const names = ["alder", "birch", "grass", "mugwort", "olive", "ragweed"]
  const peakMix = peak.list.map((v, i) => `${names[i]} ${Math.round(v)}`).filter((s) => !s.endsWith(" 0"))
  return [
    `Pollen forecast at ${d?.latitude ?? latitude}, ${d?.longitude ?? longitude}:`,
    `  Peak ${peak.t} — total ${Math.round(peak.total)} grains/m³${peakMix.length ? ` (${peakMix.join(", ")})` : ""}`,
    "",
    ...rows.filter((_, i) => i % Math.max(1, Math.round(rows.length / 12)) === 0).map((r) => `${r.t} · total ${Math.round(r.total)} grains/m³`),
  ].join("\n")
}

export async function compareLocations(locations: { name?: string; latitude: number; longitude: number }[]): Promise<string> {
  if (!Array.isArray(locations) || locations.length < 2 || locations.length > 5) {
    throw new AirQualityError("provide 2 to 5 locations")
  }
  const rows = await Promise.all(
    locations.map(async (loc) => {
      const d = await getJson(`${BASE}?${coords(loc.latitude, loc.longitude)}&current=european_aqi,pm2_5,us_aqi`)
      const c = d?.current ?? {}
      return { name: loc.name ?? `${loc.latitude},${loc.longitude}`, aqi: Number(c.european_aqi), pm25: c.pm2_5, us: c.us_aqi }
    })
  )
  const sorted = [...rows].sort((a, b) => (a.aqi || 999) - (b.aqi || 999))
  return [
    "Air quality comparison (cleanest first, European AQI):",
    "",
    ...sorted.map((r, i) => `${i + 1}. ${r.name} — AQI ${fmt(r.aqi)} (${euBand(r.aqi)}) · PM2.5 ${fmt(r.pm25, " µg/m³")} · US AQI ${fmt(r.us)}`),
  ].join("\n")
}
