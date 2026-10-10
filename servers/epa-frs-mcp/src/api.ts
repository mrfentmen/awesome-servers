const BASE = "https://data.epa.gov/efservice"
const UA = "mrfentmen-epa-frs-mcp/1.0 (https://github.com/mrfentmen)"
export class FRSError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Encoding": "identity" },
    signal: AbortSignal.timeout(90000),
  })
  if (!res.ok) throw new FRSError(`EPA FRS returned HTTP ${res.status}`)
  return (await res.json()) as T
}

function addr(f: any): string {
  return [f?.address1, f?.city, f?.state, f?.zip].filter(Boolean).join(", ") || "no address"
}

function fmtFacility(f: any, i: number): string {
  const lines = [
    `${i + 1}. ${f?.facility_name ?? "n/a"} | frs ${f?.frs_id ?? f?.facility_id ?? "n/a"}`,
    `   ${addr(f)}`,
  ]
  if (f?.county) lines.push(`   County: ${f.county}`)
  if (f?.naics_code) lines.push(`   NAICS: ${f.naics_code}`)
  if (f?.latitude != null && f?.longitude != null) lines.push(`   ${f.latitude}, ${f.longitude}`)
  return lines.join("\n")
}

export async function byState(args: { state?: string; limit?: number }): Promise<string> {
  const state = (args.state ?? "").trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(state)) throw new FRSError("Provide a two letter state code like VA")
  const limit = Math.min(args.limit ?? 10, 25)
  const list = await get<any[]>(`${BASE}/PUB_DIM_FACILITY/STATE/${encodeURIComponent(state)}/JSON`)
  const rows = (list ?? []).slice(0, limit)
  if (!rows.length) return `No facilities found in ${state}`
  return `EPA facilities in ${state} (${list?.length ?? rows.length} total, ${rows.length} shown):\n` + rows.map(fmtFacility).join("\n")
}

export async function facility(args: { registryId?: string }): Promise<string> {
  const id = (args.registryId ?? "").trim()
  if (!/^\d+$/.test(id)) throw new FRSError("Provide a numeric FRS registry ID")
  const list = await get<any[]>(`${BASE}/PUB_DIM_FACILITY/FRS_ID/${encodeURIComponent(id)}/JSON`)
  const f = (list ?? [])[0]
  if (!f) throw new FRSError(`Facility not found: ${id}`)
  const lines = [
    `Name: ${f?.facility_name ?? "n/a"}`,
    `FRS ID: ${f?.frs_id ?? f?.facility_id ?? id}`,
    `Address: ${addr(f) || "n/a"}`,
    `County: ${f?.county ?? "n/a"}`,
    `State: ${f?.state_name ?? f?.state ?? "n/a"}`,
  ]
  if (f?.latitude != null && f?.longitude != null) lines.push(`Coordinates: ${f.latitude}, ${f.longitude}`)
  if (f?.naics_code) lines.push(`NAICS: ${f.naics_code}`)
  if (f?.parent_company) lines.push(`Parent: ${f.parent_company}`)
  return lines.join("\n")
}

// ---- muxA tools:
// The existing tools read the facility dimension table, so the new ones read the
// program table that maps a facility to the EPA programmes it is registered
// under. It is the same service and the same JSON route shape.
interface ProgramRow {
  registry_id?: string;
  primary_name?: string;
  pgm_sys_acrnm?: string;
  pgm_sys_id?: string;
  location_address?: string;
  city_name?: string;
  state_code?: string;
  postal_code?: string;
  county_name?: string;
  epa_region_code?: string;
  federal_agency_code?: string;
  site_type_name?: string;
  public_ind?: string;
  sensitive_ind?: string;
  small_bus_ind?: string;
  data_quality_code?: string;
  last_reported_date?: string;
}

const countOf = (rows: unknown): number | null => {
  const first = Array.isArray(rows) ? (rows[0] as { TOTALQUERYRESULTS?: number } | undefined) : undefined;
  return first && typeof first.TOTALQUERYRESULTS === 'number' ? first.TOTALQUERYRESULTS : null;
};

function stateFilter(state: string): string {
  if (!/^[A-Z]{2}$/.test(state)) throw new FRSError('Provide a two letter state code like VA');
  return `/STATE_CODE/${encodeURIComponent(state)}`;
}

export interface ProgramCountArgs {
  state?: string;
}

export async function programCount(args: ProgramCountArgs = {}): Promise<string> {
  const raw = (args.state ?? '').trim().toUpperCase();
  const suffix = raw ? stateFilter(raw) : '';
  const rows = await get<unknown>(`${BASE}/FRS_PROGRAM_FACILITY${suffix}/COUNT/JSON`);
  const total = countOf(rows);
  if (total === null) throw new FRSError('The EPA service did not return a count.');
  const where = raw ? `in ${raw}` : 'across the whole country';
  return [
    `Facility to programme registrations ${where}: ${total.toLocaleString('en-US')}`,
    '  one row per facility per programme, so a single facility is counted once for each programme it is registered under.',
    '  this is the count the EPA service itself returns, not a count of the rows fetched.',
  ].join('\n');
}

export interface ProgramFacilitiesArgs {
  state: string;
  limit?: number;
}

