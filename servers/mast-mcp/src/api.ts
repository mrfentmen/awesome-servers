/**
 * MAST (Mikulski Archive for Space Telescopes) Mashup API client, keyless.
 * Cone search via Mast.Caom.Cone (flat ra/dec/radius params).
 * Docs: https://mast.stsci.edu/api/v0/
 */
const API = "https://mast.stsci.edu/api/v0/invoke"

export class MastError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function invoke(service: string, params: Raw, pagesize = 10): Promise<Raw[]> {
  const body = new URLSearchParams({
    request: JSON.stringify({ service, params, format: "json", pagesize }),
  })
  const res = await fetch(API, {
    method: "POST",
    headers: { "User-Agent": "mast-mcp/1.0", "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: body.toString(),
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new MastError(`MAST error ${res.status}`)
  const data = (await res.json()) as Raw
  if (data.status === "ERROR") throw new MastError(`MAST: ${String(data.msg ?? "query failed").slice(0, 200)}`)
  const rows: Raw[] = Array.isArray(data.data) ? data.data : []
  if (data.status !== "COMPLETE" && rows.length === 0) {
    throw new MastError(`MAST: ${String(data.msg ?? "query failed").slice(0, 200)}`)
  }
  return rows
}

export interface Observation {
  target?: string
  collection?: string
  instrument?: string
  filters?: string
  date?: string
  id?: string
}

export async function coneSearch(ra: number, dec: number, radius = 0.1, limit = 5): Promise<Observation[]> {
  if (!isFinite(ra) || ra < 0 || ra > 360) throw new MastError("RA must be 0-360 degrees.")
  if (!isFinite(dec) || dec < -90 || dec > 90) throw new MastError("Dec must be -90..90 degrees.")
  if (!isFinite(radius) || radius <= 0 || radius > 5) throw new MastError("Radius must be 0-5 degrees.")
  const rows = await invoke("Mast.Caom.Cone", { ra, dec, radius }, Math.min(Math.max(limit, 1), 50))
  return rows.slice(0, limit).map((r) => ({
    target: r.target_name,
    collection: r.obs_collection,
    instrument: Array.isArray(r.instrument_name) ? r.instrument_name.join(",") : r.instrument_name,
    filters: Array.isArray(r.filters) ? r.filters.join(",") : r.filters,
    date: r.t_min ? String(r.t_min).slice(0, 10) : undefined,
    id: r.obsid,
  }))
}

export function formatObs(o: Observation, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const bits = [o.target, o.collection, o.instrument, o.filters].filter(Boolean).join(" · ")
  return `${prefix}${bits || "(observation)"}${o.date ? ` (${o.date})` : ""}${o.id ? ` [${o.id}]` : ""}`
}

// ---- muxC tools:

