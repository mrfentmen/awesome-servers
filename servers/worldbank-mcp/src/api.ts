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

const WB_UA = "mrfentmen-worldbank-mcp/1.0 (https://github.com/mrfentmen)"

class WorldBankToolError extends Error {}

async function wb(path: string, ms = 30000): Promise<any> {
  const res = await fetch(`https://api.worldbank.org/v2/${path}${path.includes("?") ? "&" : "?"}format=json`, {
    headers: { "User-Agent": WB_UA, Accept: "application/json" },
    signal: AbortSignal.timeout(ms),
  })
  if (!res.ok) throw new WorldBankToolError(`The World Bank api returned ${res.status} for ${path}`)
  return await res.json()
}

/** A country's own record: region, income group, capital, lat and long. */
export async function countryProfile(args: { country?: string }): Promise<string> {
  const iso = (args.country ?? "").trim().toUpperCase()
  if (!iso) throw new WorldBankToolError("Provide a two or three letter country code, e.g. USA, BRA or DEU")
  if (!/^[A-Z]{2,3}$/.test(iso)) throw new WorldBankToolError("A World Bank country code is two or three capitals, e.g. USA")
  const d = await wb(`country/${iso}`)
  const row = Array.isArray(d) ? d[1]?.[0] : d?.data?.[0]
  if (!row) return `The World Bank has no country record for "${iso}".`
  return [
    `${row.name} (${row.id}, ${row.iso2Code})`,
    `region: ${row.region?.value ?? "not reported"} | income group: ${row.incomeLevel?.value ?? "not reported"} | lending type: ${row.lendingType?.value ?? "not reported"}`,
    `capital: ${row.capitalCity ?? "not reported"} | longitude ${row.longitude ?? "?"} latitude ${row.latitude ?? "?"}`,
    `small state: ${row.smallState ? "yes" : "no"}`,
  ].join("\n")
}

/** The indicator directory itself, so a caller can find a code before asking for data. */
export async function indicatorCatalog(args: { query?: string; limit?: number }): Promise<string> {
  const query = (args.query ?? "").trim()
  const limit = Math.max(1, Math.min(args.limit ?? 15, 50))
  const d = await wb(`indicator?per_page=${limit}${query ? `&search=${encodeURIComponent(query)}` : ""}`)
  const rows: any[] = d?.[1] ?? []
  if (!rows.length) return `The World Bank indicator directory has nothing matching "${query}".`
  return `World Bank indicators${query ? ` matching "${query}"` : ""} (${d?.[0]?.total ?? rows.length} total, ${rows.length} shown):\n` +
    rows.map((r, i) => `${i + 1}. ${r.id} - ${r.name}\n   source: ${r.source?.value ?? "not reported"} | unit: ${r.unit || "none"} | ${r.sourceNote ? String(r.sourceNote).replace(/\s+/g, " ").slice(0, 120) : "no note"}`).join("\n")
}
