/**
 * AlphaFold — AlphaFold predicted protein structures from the EBI database. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against alphafold.ebi.ac.uk.
 */
const API = "https://alphafold.ebi.ac.uk/api"

export class AlphaFoldError extends Error {}

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
      headers: { "user-agent": "alphafold-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new AlphaFoldError(`AlphaFold returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof AlphaFoldError) throw e
    if ((e as Error).name === "AbortError") throw new AlphaFoldError("AlphaFold request timed out")
    throw new AlphaFoldError(`AlphaFold request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function getPrediction(accession: string): Promise<string> {
  const acc = accession.trim().toUpperCase()
  if (acc === "") throw new AlphaFoldError("accession must not be empty")
  const body = await get<unknown>(`${API}/prediction/${encodeURIComponent(acc)}`)
  const models = rows(body)
  if (models.length === 0) return `AlphaFold has no prediction for ${acc}.`
  const first = models[0]
  return [
    `AlphaFold model for ${acc}`,
    "",
    `Entry: ${val(at(first, "entryId"))}`,
    `Version: ${val(at(first, "latestVersion"))}`,
    `Tool: ${val(at(first, "toolUsed"))}`,
    `Length: ${val(at(first, "uniprotEnd"))} aa`,
    `PDB: ${val(at(first, "pdbUrl"))}`,
  ].join("\n")
}
