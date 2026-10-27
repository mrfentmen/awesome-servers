const BASE = "https://waterservices.usgs.gov/nwis"
const H = { "User-Agent": "mrfentmen-usgs-water-mcp/1.0" }
export class WaterError extends Error {}
async function get(path: string, params: Record<string, string>) { const u = new URL(`${BASE}/${path}`); Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v)); const r = await fetch(u, { headers: H, signal: AbortSignal.timeout(20000) }); if (!r.ok) throw new WaterError(`USGS Water error ${r.status}`); return r.json() }
export function streamflow(site: string, parameter = "00060", start?: string, end?: string) { return get("iv/", { format: "json", sites: site, parameterCd: parameter, siteStatus: "all", ...(start ? { startDT: start } : {}), ...(end ? { endDT: end } : {}) }) }
export async function gauges(bbox: string, limit = 20) { const data = await get("site/", { format: "json", bBox: bbox, siteStatus: "active", siteType: "ST", seriesCatalogOutput: "false" }) as { value?: { timeSeries?: unknown[]; queryInfo?: unknown; sourceInfo?: unknown[] } }; if (Array.isArray(data.value?.sourceInfo)) data.value.sourceInfo = data.value.sourceInfo.slice(0, limit); return data }
export function format(data: any) { return JSON.stringify(data, null, 2).slice(0, 12000) }
