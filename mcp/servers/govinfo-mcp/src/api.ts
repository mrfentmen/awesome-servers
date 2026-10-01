/**
 * GovInfo API client. Needs GOVINFO_API_KEY (free at https://api.govinfo.gov/).
 * Uses the published/search endpoints (no service key needed beyond api_key).
 * Docs: https://api.govinfo.gov/docs/
 *
 * The Federal Register premium tools moved to the licence gateway (src/gateway.ts);
 * what remains here is the free GovInfo client.
 */
const BASE = "https://api.govinfo.gov"

export class GovInfoError extends Error {}

function apiKey(): string {
  const k = process.env.GOVINFO_API_KEY
  if (!k) throw new GovInfoError("Set GOVINFO_API_KEY first (free at api.govinfo.gov).")
  return k
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const sep = path.includes("?") ? "&" : "?"
  const res = await fetch(`${BASE}${path}${sep}api_key=${encodeURIComponent(apiKey())}`, {
    headers: { "User-Agent": "govinfo-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(25000),
  })
  if (res.status === 401 || res.status === 403) throw new GovInfoError("GovInfo refused (401/403). Check GOVINFO_API_KEY.")
  if (res.status === 404) throw new GovInfoError("Not found.")
  if (!res.ok) throw new GovInfoError(`GovInfo error ${res.status}`)
  return (await res.json()) as T
}

async function postJson<T>(path: string, body: Raw): Promise<T> {
  const res = await fetch(`${BASE}${path}?api_key=${encodeURIComponent(apiKey())}`, {
    method: "POST",
    headers: { "User-Agent": "govinfo-mcp/1.0", Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25000),
  })
  if (res.status === 401 || res.status === 403) throw new GovInfoError("GovInfo refused (401/403). Check GOVINFO_API_KEY.")
  if (!res.ok) throw new GovInfoError(`GovInfo error ${res.status}`)
  return (await res.json()) as T
}

export interface Collection {
  code: string
  name?: string
}

export async function listCollections(): Promise<Collection[]> {
  const data = await getJson<Raw>("/collections?offsetMark=*")
  const rows: Raw[] = Array.isArray(data.collections) ? data.collections : []
  return rows.slice(0, 30).map((c) => ({ code: String(c.collectionCode ?? "?"), name: c.collectionName }))
}

export interface PubHit {
  id?: string
  title?: string
  date?: string
  collection?: string
}

export async function searchPublished(query: string, collection = "", limit = 5): Promise<PubHit[]> {
  if (!query.trim()) throw new GovInfoError("Query is empty.")
  const body: Raw = {
    query: query.trim(),
    pageSize: Math.min(Math.max(limit, 1), 100),
    offsetMark: "*",
    sorts: [{ field: "relevance", sortOrder: "DESC" }],
  }
  if (collection.trim()) body.facets = { collection: collection.trim() };
  const data = await postJson<Raw>("/search/published", body)
  const rows: Raw[] = Array.isArray(data.results) ? data.results : []
  return rows.slice(0, limit).map((r) => ({
    id: r.packageId,
    title: r.title,
    date: r.dateIssued ? String(r.dateIssued).slice(0, 10) : undefined,
    collection: r.collectionCode,
  }))
}

export function formatHit(h: PubHit, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  return `${prefix}[${h.id ?? "?"}] ${h.title ?? "(untitled)"}${h.collection ? ` (${h.collection})` : ""}${h.date ? ` — ${h.date}` : ""}`
}

// The free corpus-size tool reads the collections index through the shared
// DEMO_KEY; the Federal Register premium bodies now run on the licence gateway.
const DEMO_KEY = "DEMO_KEY"

export async function collectionStatistics(args: { query?: string; limit?: number }): Promise<string> {
  const limit = Math.min(Math.max(args.limit ?? 15, 1), 60)
  const asked = (args.query ?? "").trim()
  const needle = asked.toLowerCase()
  const res = await fetch(`https://api.govinfo.gov/collections?api_key=${DEMO_KEY}&offsetMark=*&pageSize=200`, {
    headers: { "User-Agent": "govinfo-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(25000),
  })
  if (res.status === 401 || res.status === 403) throw new GovInfoError("GovInfo refused (401/403) on the shared DEMO_KEY.")
  if (!res.ok) throw new GovInfoError(`GovInfo error ${res.status}`)
  const data = (await res.json()) as Raw
  const all: Raw[] = Array.isArray(data.collections) ? data.collections : []
  if (all.length === 0) throw new GovInfoError("GovInfo returned no collections.")
  const kept = needle
    ? all.filter((c) => String(c.collectionName ?? "").toLowerCase().includes(needle) || String(c.collectionCode ?? "").toLowerCase().includes(needle))
    : all
  if (kept.length === 0) return `No GovInfo collection name or code matches "${asked}".`
  const pkgs = kept.filter((c) => Number(c.packageCount ?? 0) > 0)
  const grans = kept.filter((c) => Number(c.granuleCount ?? 0) > 0)
  const sorted = kept.slice().sort((a, b) => Number(b.packageCount ?? 0) - Number(a.packageCount ?? 0))
  return [
    `GovInfo corpus size${asked ? ` matching "${asked}"` : ""} - ${kept.length} of ${all.length} collections, ${pkgs.length} holding packages, ${grans.length} holding granules`,
    `Totals: ${pkgs.reduce((n, c) => n + Number(c.packageCount ?? 0), 0).toLocaleString()} packages, ${grans.reduce((n, c) => n + Number(c.granuleCount ?? 0), 0).toLocaleString()} granules`,
    "Largest by package count:",
    ...sorted.slice(0, limit).map((c, i) =>
      `${i + 1}. [${c.collectionCode ?? "?"}] ${c.collectionName ?? ""} - ${Number(c.packageCount ?? 0).toLocaleString()} packages, ${c.granuleCount == null ? "no granules reported" : `${Number(c.granuleCount).toLocaleString()} granules`}`),
    sorted.length > limit ? `...and ${sorted.length - limit} smaller collections, raise limit to see them.` : "",
  ].filter(Boolean).join("\n")
}
