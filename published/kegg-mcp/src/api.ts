/**
 * KEGG — keyless public API client.
 */
const BASE = "https://rest.kegg.jp"
const SOURCE = "KEGG"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "kegg-mcp", accept },
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

export async function getJson(path: string): Promise<any> {
  const res = await request(path)
  const body = await res.text()
  try {
    return JSON.parse(body)
  } catch {
    throw new SourceError(`${SOURCE} returned malformed JSON`)
  }
}

export async function getText(path: string, accept = "text/plain"): Promise<string> {
  const res = await request(path, accept)
  return (await res.text()).trim()
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

const check = (q: string): string => {
  const v = q.trim()
  if (!v) throw new SourceError("query is empty")
  if (/[^\w:.\-]/.test(v)) throw new SourceError("KEGG identifiers use letters, digits, colon, dot and hyphen only")
  return v
}

export async function searchGenes(a: { query: string; limit: number }): Promise<string> {
  const q = check(a.query)
  const body = await getText(`/find/genes/${encodeURIComponent(q)}`)
  const rows = body.split("\n").filter(Boolean).slice(0, a.limit)
  if (!rows.length) return `KEGG has no genes matching "${q}".`
  return [`Genes matching "${q}" (${rows.length}):`, ...rows.map((r, i) => {
    const [id, desc] = r.split("\t")
    return `${i + 1}. ${id}\n   ${(desc ?? "").replace(/;/, " -")}`
  })].join("\n")
}

export async function getKeggEntry(a: { entry: string }): Promise<string> {
  const id = check(a.entry)
  const body = await getText(`/get/${encodeURIComponent(id)}`)
  if (!body) throw new SourceError(`KEGG has no entry ${id}`)
  const lines = body.split("\n")
  const keep: string[] = []
  for (const line of lines) {
    if (/^(ENTRY|SYMBOL|NAME|DEFINITION|FORMULA|MASS|ORGANISM|ORTHOLOGY|PATHWAY|BRITE|DISEASE|MOTIF|REACTION|SUBSTRATE|PRODUCT|COMMENT|DBLINKS)/.test(line) || /^\s{12,}\S/.test(line)) keep.push(line)
  }
  const trimmed = keep.length ? keep : lines.slice(0, 40)
  return [`KEGG entry ${id} (${lines.length} lines):`, ...trimmed.slice(0, 45)].join("\n")
}

export async function pathwaysForEntry(a: { entry: string }): Promise<string> {
  const id = check(a.entry)
  const body = await getText(`/link/pathway/${encodeURIComponent(id)}`)
  const rows = body.split("\n").filter(Boolean)
  if (!rows.length) return `No pathway links for ${id}.`
  const pathways = rows.map((r) => r.split("\t")[1]).filter(Boolean)
  const names = new Map<string, string>()
  const all = [...new Set(pathways)]
  for (const p of all.slice(0, 40)) {
    const rec = await getText(`/get/${p}`).catch(() => "")
    const name = rec.split("\n").find((l) => l.startsWith("NAME"))?.replace(/^NAME\s+/, "").trim() ?? ""
    names.set(p, name)
  }
  return [`${all.length} pathways linked to ${id}:`, ...all.slice(0, 40).map((p, i) => `${i + 1}. ${p} - ${names.get(p) || "pathway"}`)].join("\n")
}

export async function searchCompounds(a: { query: string; limit: number }): Promise<string> {
  const q = check(a.query)
  const body = await getText(`/find/compound/${encodeURIComponent(q)}`)
  const rows = body.split("\n").filter(Boolean).slice(0, a.limit)
  if (!rows.length) return `KEGG has no compounds matching "${q}".`
  return [`Compounds matching "${q}" (${rows.length}):`, ...rows.map((r, i) => {
    const [id, desc] = r.split("\t")
    return `${i + 1}. ${id}\n   ${desc ?? ""}`
  })].join("\n")
}
