const BASE = "https://waterservices.usgs.gov/nwis"
const H = { "User-Agent": "mrfentmen-usgs-water-mcp/1.0" }
export class WaterError extends Error {}
async function get(path: string, params: Record<string, string>) { const u = new URL(`${BASE}/${path}`); Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v)); const r = await fetch(u, { headers: H, signal: AbortSignal.timeout(20000) }); if (!r.ok) throw new WaterError(`USGS Water error ${r.status}`); return r.json() }
export function streamflow(site: string, parameter = "00060", start?: string, end?: string) { return get("iv/", { format: "json", sites: site, parameterCd: parameter, siteStatus: "all", ...(start ? { startDT: start } : {}), ...(end ? { endDT: end } : {}) }) }
export async function gauges(bbox: string, limit = 20) { const data = await get("site/", { format: "json", bBox: bbox, siteStatus: "active", siteType: "ST", seriesCatalogOutput: "false" }) as { value?: { timeSeries?: unknown[]; queryInfo?: unknown; sourceInfo?: unknown[] } }; if (Array.isArray(data.value?.sourceInfo)) data.value.sourceInfo = data.value.sourceInfo.slice(0, limit); return data }
export function format(data: any) { return JSON.stringify(data, null, 2).slice(0, 12000) }

// ---- muxA tools:
// The existing tools dump raw instantaneous JSON and ask the site route, which
// refuses JSON. These read the daily-value statistics product on the route that
// works and turn one instantaneous reading into a readable line.
interface NwisSeries {
  sourceInfo?: { siteName?: string; siteCode?: Array<{ value?: string }> }
  variable?: { variableDescription?: string; unit?: { unitCode?: string } }
  values?: Array<{ value?: NwisPoint[] }>
}

interface NwisPoint {
  value?: string
  qualifiers?: string[]
  dateTime?: string
}

/** USGS qualifier codes seen on these routes. */
const QUALIFIER: Record<string, string> = { P: "provisional", A: "approved", e: "estimated" }

function seriesList(d: any): NwisSeries[] {
  const list = d?.value?.timeSeries
  return Array.isArray(list) ? (list as NwisSeries[]) : []
}

function points(t: NwisSeries): NwisPoint[] {
  const first = Array.isArray(t?.values) ? t.values[0] : undefined
  return Array.isArray(first?.value) ? (first?.value as NwisPoint[]) : []
}

function label(t: NwisSeries): string {
  const site = t?.sourceInfo?.siteName ?? "unknown site"
  const code = t?.sourceInfo?.siteCode?.[0]?.value ?? "?"
  const what = t?.variable?.variableDescription ?? "unknown parameter"
  const unit = t?.variable?.unit?.unitCode ?? "?"
  return `${site} (${code}) — ${what} in ${unit}`
}

function qualifierText(qualifiers: string[] | undefined): string {
  const q = (qualifiers ?? [])[0]
  if (!q) return ""
  return ` [${QUALIFIER[q] ?? q}]`
}

export interface DailyValuesArgs {
  site: string
  parameter?: string
  period?: string
}

export interface LatestValueArgs {
  site: string
  parameter?: string
}

export async function latestValue(args: LatestValueArgs): Promise<string> {
  const site = (args.site ?? "").trim()
  if (!site) throw new WaterError("Provide a USGS site number, like 01646500.")
  const parameter = (args.parameter ?? "00060").trim() || "00060"
  const d = await get("iv/", { format: "json", sites: site, parameterCd: parameter, period: "PT1H" })
  const ts = seriesList(d)
  if (!ts.length) return `No instantaneous values for site ${site} and parameter ${parameter} in the last hour.`;
  const lines = ["USGS latest instantaneous readings, last hour:"]
  for (const t of ts.slice(0, 5)) {
    const values = points(t).filter((p) => typeof p.value === "string" && p.value.trim() !== "")
    const last = values[values.length - 1]
    lines.push(`  ${label(t)}`);
    if (!last) {
      lines.push("    no reading reported in the last hour");
      continue;
    }
    lines.push(`    ${last.value}${qualifierText(last.qualifiers)} at ${last.dateTime ?? "unknown time"}`);
    lines.push(`    ${values.length} readings in the last hour`);
  }
  lines.push("Provisional readings can still be revised by USGS.");
  return lines.join("\n");
}
