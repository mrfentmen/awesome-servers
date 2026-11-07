/**
 * RCSB PDB — Experimental 3D structures of proteins and nucleic acids from the Protein Data Bank. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against data.rcsb.org.
 */
const API = "https://data.rcsb.org/rest/v1/core"

export class RcsbPdbError extends Error {}

type Row = Record<string, unknown>

const val = (v: unknown): string => {
  if (typeof v === "string") return v
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : ""
  if (Array.isArray(v)) return v.length > 0 ? val(v[0]) : ""
  if (v && typeof v === "object") {
    const o = v as Row
    if ("en" in o) return val(o.en)
    const first = Object.values(o)[0]
    return first === undefined ? "" : val(first)
  }
  return ""
}

const at = (o: unknown, path: string): unknown =>
  path === "" ? o : path.split(".").reduce<unknown>((acc, k) => (acc && typeof acc === "object" ? (acc as Row)[k] : undefined), o)

const rows = (v: unknown): Row[] => (Array.isArray(v) ? (v as Row[]) : [])

async function get<T>(url: string, init?: RequestInit, timeoutMs = 25000): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: { "user-agent": "rcsb-pdb-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new RcsbPdbError(`RCSB PDB returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof RcsbPdbError) throw e
    if ((e as Error).name === "AbortError") throw new RcsbPdbError("RCSB PDB request timed out")
    throw new RcsbPdbError(`RCSB PDB request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function getStructure(pdbId: string): Promise<string> {
  const id = pdbId.trim().toUpperCase()
  if (id.length !== 4) throw new RcsbPdbError("PDB id must be four characters, e.g. 4HHB")
  const body = await get<unknown>(`${API}/entry/${encodeURIComponent(id)}`)
  const method = val(at(body, "exptl"))
  const resolution = val(at(body, "rcsb_entry_info.resolution_combined"))
  return [
    `${id} — ${val(at(body, "struct.title"))}`,
    "",
    `Method: ${method === "" ? "n/a" : method}`,
    `Resolution: ${resolution === "" ? "n/a" : resolution + " A"}`,
    `Released: ${val(at(body, "rcsb_accession_info.initial_release_date"))}`,
    `Polymer entities: ${val(at(body, "rcsb_entry_info.polymer_entity_count"))}`,
  ].join("\n")
}
