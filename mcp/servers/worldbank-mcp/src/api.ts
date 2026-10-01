const m0 = (() => {
const BASE = "https://api.worldbank.org/v2"
const UA = "mrfentmen-worldbank-mcp/1.0 (https://github.com/mrfentmen)"
class WorldbankError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new WorldbankError(`World Bank returned HTTP ${res.status}`)
  return (await res.json()) as T
}

async function indicator(args: { country?: string; indicatorCode?: string; limit?: number }): Promise<string> {
  const country = (args.country ?? "USA").trim().toUpperCase()
  const code = (args.indicatorCode ?? "").trim()
  if (!code) throw new WorldbankError("Provide an indicator code like NY.GDP.MKTP.CD")
  const limit = Math.min(args.limit ?? 12, 50)
  const d = await get<any[]>(`${BASE}/country/${encodeURIComponent(country)}/indicator/${encodeURIComponent(code)}?format=json&per_page=${limit}`)
  const rows = (d?.[1] ?? []) as any[]
  if (!rows.length) return `No data for ${code} in ${country}`
  const lines = rows.map((r: any) => `${r?.date ?? "?"}: ${r?.value != null ? Number(r.value).toLocaleString() : "n/a"}`)
  return `Indicator ${code} for ${country} (newest first):\n` + lines.join("\n")
}

async function countries(_args?: unknown): Promise<string> {
  const d = await get<any[]>(`${BASE}/country?format=json&per_page=300`)
  const rows = (d?.[1] ?? []) as any[]
  if (!rows.length) return "No countries found"
  const list = rows.filter((r: any) => r?.region?.value && r.region.value !== "Aggregates")
  return `World Bank countries (${list.length}):\n` + list.map((c: any, i: number) => {
    const region = c?.region?.value ?? ""
    const income = c?.incomeLevel?.value ?? ""
    return `${i + 1}. ${c?.name ?? "n/a"} (${c?.id ?? ""}) | ${region} | ${income}`
  }).join("\n")
}

return { WorldbankError, countries, indicator };
})();

const m1 = (() => {
const UA = "mrfentmen-energy-climate-mcp/1.0 (https://github.com/mrfentmen)"
class EnergyError extends Error {}

async function worldbankIndicator(args: { indicator?: string; country?: string }): Promise<string> {
  const ind = encodeURIComponent(args.indicator ?? "EG.USE.ELEC.KH.PC")
  const country = encodeURIComponent(args.country ?? "USA")
  const res = await fetch(`https://api.worldbank.org/v2/country/${country}/indicator/${ind}?format=json&per_page=20`, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new EnergyError(`World Bank error ${res.status}`)
  const d = await res.json()
  const meta = d[1]?.[0]?.indicator?.value ?? ind
  const rows = (d[1] ?? []).filter((r: any) => r.value != null).slice(-15)
  return `${meta} for ${d[1]?.[0]?.country?.value ?? country}\n${rows.map((r: any) => `${r.date}: ${r.value}`).join("\n") || "No data"}`
}

async function eiaSeries(args: { series_id?: string }): Promise<string> {
  const key = process.env.EIA_API_KEY
  if (!key) throw new EnergyError("Set the EIA_API_KEY environment variable to your free EIA key")
  const id = encodeURIComponent(args.series_id ?? "")
  const res = await fetch(`https://api.eia.gov/v2/series/?api_key=${key}&series_id=${id}`, { signal: AbortSignal.timeout(25000) })
  if (!res.ok) throw new EnergyError(`EIA error ${res.status}`)
  const d = await res.json()
  const series = d.response?.data?.[0]
  const rows = (series?.data ?? []).slice(-15)
  return `${series?.name ?? id}\n${rows.map((r: any) => `${r.period}: ${r.value}`).join("\n") || "No data"}`
}

return { EnergyError, eiaSeries, worldbankIndicator };
})();

export const EnergyError = m1.EnergyError;
export const WorldbankError = m0.WorldbankError;
export const countries = m0.countries;
export const eiaSeries = m1.eiaSeries;
export const indicator = m0.indicator;
export const worldbankIndicator = m1.worldbankIndicator;
export const m0_countries = m0.countries;
export const m0_indicator = m0.indicator;
export const m0_WorldbankError = m0.WorldbankError;
export const m1_eiaSeries = m1.eiaSeries;
export const m1_EnergyError = m1.EnergyError;
export const m1_worldbankIndicator = m1.worldbankIndicator;

// ---- muxC tools:

