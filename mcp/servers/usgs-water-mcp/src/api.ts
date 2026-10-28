const BASE = "https://waterservices.usgs.gov/nwis"
const H = { "User-Agent": "mrfentmen-usgs-water-mcp/1.0" }
export class WaterError extends Error {}
async function get(path: string, params: Record<string, string>) { const u = new URL(`${BASE}/${path}`); Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v)); const r = await fetch(u, { headers: H, signal: AbortSignal.timeout(20000) }); if (!r.ok) throw new WaterError(`USGS Water error ${r.status}`); return r.json() }
export function streamflow(site: string, parameter = "00060", start?: string, end?: string) { return get("iv/", { format: "json", sites: site, parameterCd: parameter, siteStatus: "all", ...(start ? { startDT: start } : {}), ...(end ? { endDT: end } : {}) }) }
export async function gauges(bbox: string, limit = 20) { const data = await get("site/", { format: "json", bBox: bbox, siteStatus: "active", siteType: "ST", seriesCatalogOutput: "false" }) as { value?: { timeSeries?: unknown[]; queryInfo?: unknown; sourceInfo?: unknown[] } }; if (Array.isArray(data.value?.sourceInfo)) data.value.sourceInfo = data.value.sourceInfo.slice(0, limit); return data }
export function format(data: any) { return JSON.stringify(data, null, 2).slice(0, 12000) }

export async function siteInfo(a: { site: string }) {
  const site = a.site
  const data: any = await get("iv/", { format: "json", sites: site, parameterCd: "00060", period: "PT2H" })
  const info = data?.value?.timeSeries?.[0]?.sourceInfo
  if (!info) throw new WaterError(`No USGS site ${site}`)
  const name = info.siteName ?? ""
  const code = info.siteCode?.[0]?.value ?? site
  const geo = info.geoLocation?.geogLocation ?? {}
  const props: any[] = Array.isArray(info.siteProperty) ? info.siteProperty : []
  const prop = (n: string) => props.find((p) => String(p.name).toLowerCase() === n.toLowerCase())?.value
  return [
    `${name} (${code})`,
    geo.latitude !== undefined ? `  coordinates: ${geo.latitude}, ${geo.longitude}` : "",
    prop("county") ? `  county: ${prop("county")}` : "",
    prop("state") ? `  state: ${prop("state")}` : "",
    prop("hucCd") ? `  HUC: ${prop("hucCd")}` : "",
    prop("drainageArea") ? `  drainage area: ${prop("drainageArea")} sq mi` : "",
    `  site page: https://waterdata.usgs.gov/monitoring-location/${code}/`,
  ].filter(Boolean).join("\n")
}
export async function dailyValues(a: { site: string; parameter?: string; start?: string; end?: string }): Promise<string> {
  const { site, start, end } = a
  const parameter = a.parameter || "00060"
  const data: any = await get("dv/", { format: "json", sites: site, parameterCd: parameter, ...(start ? { startDT: start } : {}), ...(end ? { endDT: end } : {}) })
  const series: any[] = data?.value?.timeSeries ?? []
  if (!series.length) return `No daily values for site ${site} (parameter ${parameter}).`
  const lines: string[] = []
  for (const ts of series) {
    const unit = ts?.variable?.unit?.unitCode ?? ""
    const points: any[] = ts?.values?.[0]?.value ?? []
    lines.push(`${ts?.variable?.variableDescription ?? parameter} (${unit})`)
    for (const p of points.slice(-30)) lines.push(`  ${String(p.dateTime).slice(0, 10)}  ${p.value}`)
  }
  return lines.join("\n")
}
export const PARAMETERS = [
  { code: "00060", name: "Discharge", unit: "ft3/s" },
  { code: "00065", name: "Gage height", unit: "ft" },
  { code: "00010", name: "Water temperature", unit: "deg C" },
  { code: "00045", name: "Precipitation", unit: "in" },
  { code: "00300", name: "Dissolved oxygen", unit: "mg/L" },
  { code: "00400", name: "pH", unit: "standard units" },
  { code: "63680", name: "Turbidity", unit: "FNU" },
  { code: "80154", name: "Suspended sediment concentration", unit: "mg/L" },
]
export function parameterCodes() {
  return ["Common USGS parameter codes:", ...PARAMETERS.map((p) => `  ${p.code}  ${p.name} (${p.unit})`)].join("\n")
}
