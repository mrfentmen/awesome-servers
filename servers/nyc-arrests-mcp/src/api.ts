export class NycArrestsError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NycArrestsError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
const YTD = "https://data.cityofnewyork.us/resource/uip8-fykc.json";
const HIST = "https://data.cityofnewyork.us/resource/8h9b-rp9u.json";

const BOROS: Record<string, string> = {
  manhattan: "M", brooklyn: "K", queens: "Q", bronx: "B", staten: "S",
};

function headers(): Record<string, string> {
  const h: Record<string, string> = { ...UA, Accept: "application/json" };
  if (process.env.NYC_APP_TOKEN) h["X-App-Token"] = process.env.NYC_APP_TOKEN;
  return h;
}

function boro(v?: string): string | null {
  if (!v) return null;
  const t = v.trim().toLowerCase();
  if (t.length === 1) return t.toUpperCase();
  for (const [k, code] of Object.entries(BOROS)) {
    if (t.startsWith(k)) return code;
  }
  return null;
}

function clauses(filters: string[]): string {
  return filters.length ? `$where=${encodeURIComponent(filters.join(" AND "))}&` : "";
}

function baseFilters(opts: { borough?: string; offense?: string; from?: string; to?: string; age?: string; sex?: string }): string[] {
  const f: string[] = [];
  const b = boro(opts.borough);
  if (b) f.push(`arrest_boro='${b}'`);
  if (opts.offense) {
    const o = opts.offense.trim().replace(/'/g, "''").toUpperCase();
    f.push(`(upper(ofns_desc) like '%${o}%' OR upper(pd_desc) like '%${o}%')`);
  }
  if (opts.from) f.push(`arrest_date >= '${opts.from}T00:00:00'`);
  if (opts.to) f.push(`arrest_date <= '${opts.to}T23:59:59'`);
  if (opts.age) f.push(`age_group='${opts.age.trim().toUpperCase()}'`);
  if (opts.sex) f.push(`perp_sex='${opts.sex.trim().toUpperCase()}'`);
  return f;
}

async function query(base: string, extra: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(base + "?" + extra, { headers: headers(), signal: AbortSignal.timeout(30000) });
  } catch (e) {
    throw new NycArrestsError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new NycArrestsError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 14000);
}

function slim(t: string): string {
  try {
    const rows = JSON.parse(t) as Array<Record<string, unknown>>;
    if (!Array.isArray(rows)) return t.slice(0, 4000);
    return JSON.stringify(rows.map((r) => ({
      key: r.arrest_key, date: r.arrest_date, offense: r.ofns_desc ?? r.pd_desc,
      law: r.law_code, category: r.law_cat_cd, boro: r.arrest_boro, precinct: r.arrest_precinct,
      age: r.age_group, sex: r.perp_sex, race: r.perp_race, lat: r.latitude, lon: r.longitude,
    })), null, 2).slice(0, 12000);
  } catch {
    return t.slice(0, 4000);
  }
}

export function searchArrests(opts: { borough?: string; offense?: string; from?: string; to?: string; age?: string; sex?: string; limit?: string }): Promise<string> {
  const n = Math.min(Number(opts.limit ?? 20) || 20, 100);
  return query(YTD, `${clauses(baseFilters(opts))}$limit=${n}&$order=arrest_date DESC`).then(slim);
}

export function arrestDetails(arrestKey: string): Promise<string> {
  return query(YTD, `$where=${encodeURIComponent(`arrest_key='${arrestKey.trim()}'`)}`).then(slim);
}

export function historicSearch(opts: { borough?: string; offense?: string; from?: string; to?: string; age?: string; sex?: string; limit?: string }): Promise<string> {
  const n = Math.min(Number(opts.limit ?? 20) || 20, 100);
  return query(HIST, `${clauses(baseFilters(opts))}$limit=${n}&$order=arrest_date DESC`).then(slim);
}

export function topOffenses(borough?: string, limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 25);
  const b = boro(borough);
  const where = b ? `$where=${encodeURIComponent(`arrest_boro='${b}'`)}&` : "";
  return query(YTD, `${where}$select=${encodeURIComponent("ofns_desc,count(arrest_key)")}&$group=${encodeURIComponent("ofns_desc")}&$order=${encodeURIComponent("count_arrest_key DESC")}&$limit=${n}`);
}

export function precinctActivity(precinct: string, limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 100);
  const p = precinct.trim();
  return query(YTD, `$where=${encodeURIComponent(`arrest_precinct='${p}'`)}&$limit=${n}&$order=arrest_date DESC`).then(slim);
}

export function boroughStats(borough: string): Promise<string> {
  const b = boro(borough) ?? borough.trim().toUpperCase();
  return query(YTD, `$where=${encodeURIComponent(`arrest_boro='${b}'`)}&$select=${encodeURIComponent("law_cat_cd,count(arrest_key)")}&$group=${encodeURIComponent("law_cat_cd")}`);
}

export function recentFelonies(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 100);
  return query(YTD, `$where=${encodeURIComponent("law_cat_cd='F'")}&$limit=${n}&$order=arrest_date DESC`).then(slim);
}

export function recentMisdemeanors(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 100);
  return query(YTD, `$where=${encodeURIComponent("law_cat_cd='M'")}&$limit=${n}&$order=arrest_date DESC`).then(slim);
}

export function offenseLookup(pdCode: string, limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 100);
  return query(YTD, `$where=${encodeURIComponent(`pd_cd='${pdCode.trim()}'`)}&$limit=${n}&$order=arrest_date DESC`).then(slim);
}

export function arrestMapData(latMin: string, latMax: string, lonMin: string, lonMax: string, limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 50) || 50, 200);
  const w = `latitude between ${latMin} and ${latMax} AND longitude between ${lonMin} and ${lonMax}`;
  return query(YTD, `$where=${encodeURIComponent(w)}&$limit=${n}&$order=arrest_date DESC`).then(slim);
}
