/**
 * Open Meteo client. Free weather forecasts and geocoding, no API key.
 */
const GEO = "https://geocoding-api.open-meteo.com/v1/search"
const FC = "https://api.open-meteo.com/v1/forecast"

export class MeteoError extends Error {}

export interface Place {
  name?: string
  latitude?: number
  longitude?: number
  country?: string
  admin1?: string
  timezone?: string
  population?: number
}

export interface Forecast {
  current?: {
    temperature?: number
    windspeed?: number
    winddirection?: number
    weathercode?: number
    is_day?: number
    time?: string
  }
  daily?: {
    time?: string[]
    temperature_2m_max?: number[]
    temperature_2m_min?: number[]
    precipitation_probability_max?: number[]
    weathercode?: number[]
  }
  daily_units?: Record<string, string>
  timezone?: string
}

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { "User-Agent": "open-meteo-mcp/1.0" },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new MeteoError(`Open Meteo error ${res.status}`)
  return res.json()
}

export async function geocode(place: string, count = 5): Promise<Place[]> {
  const d = await getJson(`${GEO}?name=${encodeURIComponent(place)}&count=${count}`)
  return d?.results ?? []
}

export async function getForecast(latitude: number, longitude: number, days = 5): Promise<Forecast> {
  const url = `${FC}?latitude=${latitude}&longitude=${longitude}` +
    `&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode` +
    `&timezone=auto&forecast_days=${Math.min(days, 14)}`
  return getJson(url)
}

export const WMO: Record<number, string> = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Rime fog", 51: "Light drizzle", 53: "Drizzle", 55: "Dense drizzle",
  56: "Freezing drizzle", 57: "Dense freezing drizzle", 61: "Slight rain", 63: "Rain",
  65: "Heavy rain", 66: "Freezing rain", 67: "Heavy freezing rain", 71: "Slight snow",
  73: "Snow", 75: "Heavy snow", 77: "Snow grains", 80: "Slight showers", 81: "Showers",
  82: "Violent showers", 85: "Snow showers", 86: "Heavy snow showers",
  95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Heavy thunderstorm with hail",
}

export function weatherName(code?: number): string {
  if (code == null) return "Unknown"
  return WMO[code] ?? `Code ${code}`
}

export function formatPlace(p: Place): string {
  const lines = [
    `${p.name ?? "?"}${p.admin1 ? `, ${p.admin1}` : ""}${p.country ? `, ${p.country}` : ""}`,
    `Coords: ${p.latitude}, ${p.longitude}`,
    p.timezone ? `Timezone: ${p.timezone}` : "",
    p.population != null ? `Population: ${p.population.toLocaleString()}` : "",
  ].filter(Boolean)
  return lines.join("\n")
}

export function formatForecast(f: Forecast, placeName: string): string {
  const c = f.current
  const lines = [
    `Weather for ${placeName}${f.timezone ? ` (${f.timezone})` : ""}`,
    c
      ? `Now: ${weatherName(c.weathercode)}, ${c.temperature ?? "?"} C, wind ${c.windspeed ?? "?"} km/h${c.is_day === 0 ? ", night" : ""}`
      : "",
    `Updated: ${c?.time ?? "?"}`,
  ].filter(Boolean)

  const d = f.daily
  if (d?.time) {
    lines.push("", "Forecast:")
    for (let i = 0; i < d.time.length; i++) {
      const max = d.temperature_2m_max?.[i]
      const min = d.temperature_2m_min?.[i]
      const pop = d.precipitation_probability_max?.[i]
      lines.push(
        `- ${d.time[i]}: ${weatherName(d.weathercode?.[i])}, ${min ?? "?"} to ${max ?? "?"} C` +
          `${pop != null ? `, rain chance ${pop}%` : ""}`,
      )
    }
  }
  return lines.join("\n")
}
