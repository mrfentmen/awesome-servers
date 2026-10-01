const BASE = "https://air-quality-api.open-meteo.com/v1/air-quality"
const UA = "mrfentmen-air-quality-mcp/1.0 (https://github.com/mrfentmen)"
export class AirError extends Error {}

const LABELS: Record<string, [string, string]> = {
  "1": ["Good", "Air quality is satisfactory and poses little risk"],
  "2": ["Moderate", "Acceptable air quality with a small risk for sensitive people"],
  "3": ["Unhealthy for sensitive", "Sensitive groups may experience effects"],
  "4": ["Unhealthy", "Everyone may begin to experience health effects"],
  "5": ["Very unhealthy", "Health alert, everyone may experience effects"],
  "6": ["Hazardous", "Emergency conditions, serious health effects"],
}

export async function airQuality(args: { lat?: number; lon?: number }): Promise<string> {
  const lat = args.lat ?? 0
  const lon = args.lon ?? 0
  if (!lat && !lon) throw new AirError("Provide lat and lon")
  const res = await fetch(
    `${BASE}?latitude=${lat}&longitude=${lon}&current=us_aqi,pm10,pm2_5,nitrogen_dioxide,ozone,carbon_monoxide,sulphur_dioxide`,
    { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) }
  )
  if (!res.ok) throw new AirError(`Open Meteo error ${res.status}`)
  const d = await res.json()
  const c = d.current ?? {}
  const aqi = Math.round(c.us_aqi ?? 0)
  const level = LABELS[String(Math.min(Math.max(Math.ceil(aqi / 50) || 1, 1), 6))]
  return `Air quality at ${lat}, ${lon}\nUS AQI: ${aqi} (${level?.[0] ?? "unknown"} level)\n  ${level?.[1] ?? ""}\n\nPM2.5: ${c.pm2_5 ?? "n/a"} µg/m3\nPM10: ${c.pm10 ?? "n/a"} µg/m3\nNO2: ${c.nitrogen_dioxide ?? "n/a"} µg/m3\nO3: ${c.ozone ?? "n/a"} µg/m3\nCO: ${c.carbon_monoxide ?? "n/a"} µg/m3\nSO2: ${c.sulphur_dioxide ?? "n/a"} µg/m3`
}

// ---- muxA tools:

// Indicative pollen-count bands, the scale weather services quote for grains/m3.
// Not an official standard, so the numbers are always printed alongside the label.
const POLLEN_BANDS: Array<[string, number]> = [
  ["very high", 200],
  ["high", 50],
  ["moderate", 10],
  ["low", 0],
]

const POLLEN: Record<string, string> = {
  alder_pollen: "Alder",
  birch_pollen: "Birch",
  grass_pollen: "Grass",
  mugwort_pollen: "Mugwort",
  olive_pollen: "Olive",
  ragweed_pollen: "Ragweed",
}

function pollenBand(value: number): string {
  for (const [label, ceiling] of POLLEN_BANDS) {
    if (value >= ceiling) return label
  }
  return "low"
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

