const BASE = "https://api.sunrise-sunset.org/json"
const UA = "mrfentmen-sunrise-sunset-mcp/1.0 (https://github.com/mrfentmen)"
export class SunError extends Error {}

export async function sunTimes(args: { lat?: number; lon?: number; date?: string }): Promise<string> {
  const lat = args.lat ?? 0
  const lon = args.lon ?? 0
  if (!lat && !lon) throw new SunError("Provide lat and lon")
  const date = args.date ?? "today"
  const res = await fetch(`${BASE}?lat=${lat}&lng=${lon}&date=${date}&formatted=0`, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new SunError(`Sunrise API error ${res.status}`)
  const d = await res.json()
  const r = d.results ?? {}
  const fmt = (s: string) => new Date(s).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  return `Sun times for ${lat}, ${lon} on ${date}\nSunrise: ${fmt(r.sunrise ?? "")}\nSunset: ${fmt(r.sunset ?? "")}\nSolar noon: ${fmt(r.solar_noon ?? "")}\nDay length: ${r.day_length ?? ""}\nCivil twilight: ${fmt(r.civil_twilight_begin ?? "")} to ${fmt(r.civil_twilight_end ?? "")}`
}

// ---- muxB tools:

