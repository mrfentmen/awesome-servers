/**
 * JPL Small-Body Database — keyless public API client.
 */
const BASE = "https://ssd-api.jpl.nasa.gov"
const SOURCE = "JPL SBDB"
const UA = "nasa-sbdb-mcp"

export class SourceError extends Error {}

async function request(path: string, init?: RequestInit, timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      ...init,
      signal: ctrl.signal,
      headers: {
        "user-agent": UA,
        accept: "application/json",
        ...(init?.headers as Record<string, string> | undefined),
      },
    })
    if (!res.ok) throw new SourceError(`${SOURCE} responded ${res.status}`)
    return res
  } catch (e) {
    if (e instanceof SourceError) throw e
    if ((e as Error).name === "AbortError") throw new SourceError(`${SOURCE} request timed out`)
    throw new SourceError(`${SOURCE} request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

export async function getJson(path: string, init?: RequestInit): Promise<any> {
  const res = await request(path, init)
  const body = await res.text()
  try {
    return JSON.parse(body)
  } catch {
    throw new SourceError(`${SOURCE} returned malformed JSON`)
  }
}

export function clampLimit(n: number | undefined, fallback: number, max: number): number {
  const v = n ?? fallback
  if (!Number.isInteger(v) || v < 1 || v > max) throw new SourceError(`limit must be between 1 and ${max}`)
  return v
}

export function clean(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim()
}

export function bullet(label: string, value: unknown): string {
  const v = value === undefined || value === null || value === "" ? "" : String(value)
  return v ? `${label}: ${v}` : ""
}

export function section(title: string, rows: string[]): string {
  return [title, ...rows.filter(Boolean)].join("\n")
}

function rowMap(fields: string[], row: any[]): Record<string, string> {
  const out: Record<string, string> = {}
  fields.forEach((f, i) => { out[f] = clean(row[i]) })
  return out
}

export async function object_lookup(a: { designation: string }): Promise<string> {
  const designation = clean(a.designation)
  if (designation.length < 2) throw new SourceError("designation must be at least 2 characters")
  const d = await getJson(`/sbdb.api?sstr=${encodeURIComponent(designation)}&full-prec=true`)
  const o = d?.object
  if (!o) throw new SourceError(`SBDB has no object "${designation}"`)
  return section(`${clean(o.fullname)} (${clean(o.des)})`, [
    bullet("Kind", o.kind === "an" ? "asteroid" : o.kind === "cn" ? "comet" : o.kind),
    bullet("Orbit class", o.orbit_class?.name),
    bullet("Near-Earth", o.neo === true ? "yes" : "no"),
    bullet("Potentially hazardous", o.pha === true ? "yes" : "no"),
    bullet("JPL id", o.spkid),
  ])
}

export async function close_approaches(a: { designation: string, from?: string, to?: string }): Promise<string> {
  const designation = clean(a.designation)
  if (designation.length < 2) throw new SourceError("designation must be at least 2 characters")
  const meta = await getJson(`/sbdb.api?sstr=${encodeURIComponent(designation)}`)
  const des = clean(meta?.object?.des)
  if (!des) throw new SourceError(`SBDB has no object "${designation}"`)
  const d = await getJson(`/cad.api?des=${encodeURIComponent(des)}&date-min=${a.from}&date-max=${a.to}`)
  const fields: string[] = Array.isArray(d?.fields) ? d.fields : []
  const rows: any[] = Array.isArray(d?.data) ? d.data : []
  if (!rows.length) return `No close approaches for "${designation}" between ${a.from} and ${a.to}.`
  return section(`${rows.length} approach(es)`, rows.slice(0, 15).map((r, i) => {
    const x = rowMap(fields, r)
    return `${i + 1}. ${x.cd} · ${Number(x.dist).toFixed(4)} au · ${Number(x.v_rel).toFixed(2)} km/s`
  }))
}

export async function query_objects(a: { kind?: string, limit?: number }): Promise<string> {
  const limit = clampLimit(a.limit, 10, 50)
  const d = await getJson(`/sbdb_query.api?fields=full_name,kind,e,a&sb-kind=${a.kind}&limit=${limit}`)
  const fields: string[] = Array.isArray(d?.fields) ? d.fields : []
  const rows: any[] = Array.isArray(d?.data) ? d.data : []
  if (!rows.length) return "SBDB returned no objects."
  return section(`${d?.count ?? "?"} objects match (showing ${rows.length})`, rows.map((r) => {
    const x = rowMap(fields, r)
    return `${clean(x.full_name)} · ${x.kind === "an" ? "asteroid" : "comet"} · e ${x.e} · a ${x.a} au`
  }))
}

export async function count_objects(a: { kind?: string }): Promise<string> {
  const d = await getJson(`/sbdb_query.api?fields=full_name&sb-kind=${a.kind}&limit=1`)
  if (d?.count === undefined) throw new SourceError("SBDB did not return a count")
  return `${clean(d.count)} ${a.kind === "a" ? "asteroid(s)" : "comet(s)"} in the SBDB catalogue.`
}

export async function orbit_classes(a: Record<string, never>): Promise<string> {
  return section("SBDB orbit classes", [
    "APO — Apollo: Earth-crossing asteroids with semi-major axis > 1 au",
    "AMO — Amor: Earth-approaching asteroids with 1.017 < q < 1.3 au",
    "ATE — Aten: Earth-crossing asteroids with semi-major axis < 1 au",
    "IEO — Atira: orbits entirely inside Earth's orbit",
    "MBA — Main-belt asteroid",
    "TNO — Trans-Neptunian object",
    "CEN — Centaur",
    "JFC — Jupiter-family comet",
    "HTC — Halley-type comet",
  ])
}
