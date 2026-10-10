/**
 * CERN Open Data API client, keyless.
 * Docs: https://opendata.cern.ch/docs/api
 */
const BASE = "http://opendata.cern.ch/api"

export class CernError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "cern-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(25000),
  })
  if (res.status === 404) throw new CernError("Not found.")
  if (!res.ok) throw new CernError(`CERN error ${res.status}`)
  return (await res.json()) as T
}

export interface CernRecord {
  id?: number
  title?: string
  type?: string
  experiment?: string
  year?: number
}

export async function searchRecords(query: string, rtype = "", limit = 5): Promise<CernRecord[]> {
  const qs = new URLSearchParams({ q: query.trim(), size: String(Math.min(Math.max(limit, 1), 50)) })
  if (rtype.trim()) qs.set("type", rtype.trim())
  const data = await getJson<Raw>(`/records/?${qs}`)
  const rows: Raw[] = Array.isArray(data.hits?.hits) ? data.hits.hits : []
  return rows.slice(0, limit).map((h) => {
    const md: Raw = h.metadata ?? {}
    return {
      id: h.id,
      title: md.title?.title ?? md.title,
      type: md.type?.primary,
      experiment: Array.isArray(md.collaboration) ? md.collaboration.map((c: Raw) => c.name ?? c).join(", ") : undefined,
      year: md.publication_year,
    }
  })
}

export async function getRecord(id: string): Promise<string> {
  if (!/^\d+$/.test(id.trim())) throw new CernError(`Record id must be numeric, got "${id}".`)
  const data = await getJson<Raw>(`/records/${id.trim()}`)
  const md: Raw = data.metadata ?? {}
  const files: Raw[] = Array.isArray(data.files) ? data.files : []
  const lines = [
    `[${data.id ?? id}] ${md.title?.title ?? md.title ?? "(untitled)"}`,
    md.abstract?.description ? `${String(md.abstract.description).replace(/<[^>]+>/g, "").slice(0, 400)}` : "",
    md.type?.primary ? `Type: ${md.type.primary}` : "",
    md.publication_year ? `Year: ${md.publication_year}` : "",
    files.length ? `Files: ${files.length} (e.g. ${String(files[0].key ?? files[0].uri ?? "").slice(0, 80)})` : "",
    `More: http://opendata.cern.ch/record/${data.id ?? id}`,
  ].filter(Boolean)
  return lines.join("\n")
}

export function formatRecord(r: CernRecord, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  return `${prefix}[${r.id ?? "?"}] ${r.title ?? "(untitled)"}${r.type ? ` (${r.type})` : ""}${r.experiment ? ` — ${r.experiment}` : ""}${r.year ? ` (${r.year})` : ""}`
}

// ---- muxC tools:

interface CernFilesPayload {
  contents?: Array<{ key?: string; size?: number; checksum?: string; mimetype?: string; version_id?: string; is_head?: boolean; delete_marker?: boolean; links?: { self?: string; version?: string } }>
  links?: { self?: string; versions?: string }
}

