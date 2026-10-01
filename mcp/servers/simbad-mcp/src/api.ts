/**
 * SIMBAD TAP client, keyless. TAP = Table Access Protocol (IVOA standard).
 * Docs: http://simbad.u-strasbg.fr/simbad/sim-tap/
 */
const BASE = "http://simbad.u-strasbg.fr/simbad/sim-tap"

export class SimbadError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function tapQuery(query: string): Promise<{ cols: string[]; rows: Raw[][] }> {
  const body = new URLSearchParams({ REQUEST: "doQuery", LANG: "ADQL", QUERY: query, FORMAT: "json" })
  const res = await fetch(`${BASE}/sync`, {
    method: "POST",
    headers: { "User-Agent": "simbad-mcp/1.0", "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: body.toString(),
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new SimbadError(`SIMBAD error ${res.status}`)
  const data = (await res.json()) as Raw
  if (data.status === "ERROR" || data.error) {
    throw new SimbadError(`SIMBAD: ${String(data.msg ?? data.error ?? "query failed").slice(0, 200)}`)
  }
  const meta: Raw[] = Array.isArray(data.metadata) ? data.metadata : []
  const rows: Raw[][] = Array.isArray(data.data) ? data.data : []
  return { cols: meta.map((m) => String(m.name ?? "?")), rows }
}

const IDENT_RE = /^[A-Za-z0-9][A-Za-z0-9 _+\-.]*$/

export async function lookupObject(ident: string): Promise<string> {
  if (!ident.trim() || !IDENT_RE.test(ident.trim())) {
    throw new SimbadError(`Not an object identifier: "${ident}". Try a name like "Vega" or "M31".`)
  }
  const safe = ident.trim().replace(/'/g, "''")
  const { cols, rows } = await tapQuery(
    `SELECT TOP 25 b.oid, b.main_id, b.otype_txt, b.ra, b.dec FROM basic AS b JOIN ident AS i ON b.oid = i.oidref WHERE i.id LIKE '%${safe}%'`
  )
  if (rows.length === 0) return `No SIMBAD objects match "${ident}".`
  const seen = new Set<string>()
  const out: string[] = []
  for (const r of rows) {
    const [oid, mainId, otype, ra, dec] = r
    if (seen.has(String(oid))) continue
    seen.add(String(oid))
    out.push(`${out.length + 1}. [${oid}] ${mainId}${otype ? ` (${otype})` : ""}${ra !== undefined && ra !== null ? ` — RA ${ra}, Dec ${dec}` : ""}`)
    if (out.length >= 5) break
  }
  return out.join("\n")
}

export async function coneSearch(ra: number, dec: number, radius = 0.1, limit = 10): Promise<string> {
  if (!isFinite(ra) || ra < 0 || ra > 360) throw new SimbadError("RA must be 0-360 degrees.")
  if (!isFinite(dec) || dec < -90 || dec > 90) throw new SimbadError("Dec must be -90..90 degrees.")
  if (!isFinite(radius) || radius <= 0 || radius > 5) throw new SimbadError("Radius must be 0-5 degrees.")
  const { rows } = await tapQuery(
    `SELECT TOP ${Math.min(Math.max(limit, 1), 50)} oid, main_id, otype_txt, ra, dec, DISTANCE(POINT('ICRS', ra, dec), POINT('ICRS', ${ra}, ${dec})) AS dist FROM basic WHERE CONTAINS(POINT('ICRS', ra, dec), CIRCLE('ICRS', ${ra}, ${dec}, ${radius})) = 1 ORDER BY dist ASC`
  )
  if (rows.length === 0) return "No objects in this cone."
  return rows.map((r, i) => {
    const [oid, mainId, otype, ra2, dec2] = r
    return `${i + 1}. [${oid}] ${mainId}${otype ? ` (${otype})` : ""} — RA ${ra2}, Dec ${dec2}`
  }).join("\n")
}

// ---- muxB tools:

async function simbadOid(ident: string): Promise<{ oid: number; mainId: string; otype: string } | null> {
  const safe = ident.trim().split("'").join("''")
  const { rows } = await tapQuery(
    `SELECT TOP 1 b.oid, b.main_id, b.otype_txt FROM basic AS b JOIN ident AS i ON b.oid = i.oidref WHERE i.id = '${safe}'`,
  )
  const row = rows[0]
  if (!row || row[0] == null) return null
  return { oid: Number(row[0]), mainId: String(row[1] ?? ident), otype: String(row[2] ?? 'not reported') }
}

const simbadText = (v: unknown): string => (v == null || String(v).trim() === '' ? 'not reported' : String(v))

export interface ObjectPhotometryArgs {
  ident?: string;
  limit?: number;
}

export interface ObjectReferencesArgs {
  ident?: string;
  limit?: number;
}

export interface ObjectIdentifiersArgs {
  ident?: string;
  limit?: number;
}

export async function objectIdentifiers(args: ObjectIdentifiersArgs): Promise<string> {
  const ident = (args.ident ?? '').trim()
  if (!IDENT_RE.test(ident)) throw new SimbadError(`Not an object identifier: "${args.ident}".`)
  const limit = Math.max(1, Math.min(args.limit ?? 20, 60))
  const target = await simbadOid(ident)
  if (!target) return `No SIMBAD object matches "${ident}".`
  const { rows } = await tapQuery(`SELECT TOP ${limit} id FROM ident WHERE oidref = ${target.oid}`)
  if (!rows.length) return `SIMBAD lists no alternate identifiers for ${target.mainId}.`
  return `Every identifier SIMBAD holds for ${target.mainId} (${target.otype}, oid ${target.oid}; ${rows.length} of ${limit} requested):\n` +
    rows.map((r, i) => `${i + 1}. ${simbadText(r[0])}`).join('\n')
}

// ---- gap4c2 tools:
