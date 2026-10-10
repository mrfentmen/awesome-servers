/**
 * GovInfo API client. Needs GOVINFO_API_KEY (free at https://api.govinfo.gov/).
 * Uses the published/search endpoints (no service key needed beyond api_key).
 * Docs: https://api.govinfo.gov/docs/
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

// ---- muxB tools:

// The Federal Register is the same corpus GovInfo distributes, published by the
// Office of the Federal Register with an open API that needs no key.
const FR_BASE = "https://www.federalregister.gov/api/v1"
const DEMO_KEY = "DEMO_KEY"

async function frSearch<T>(params: Array<[string, string]>): Promise<T> {
  const qs = new URLSearchParams()
  for (const [key, value] of params) qs.append(key, value)
  const res = await fetch(`${FR_BASE}/documents.json?${qs.toString()}`, {
    headers: { "User-Agent": "govinfo-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(25000),
  })
  if (res.status === 429) throw new GovInfoError("Federal Register rate limit reached, try again shortly.")
  if (!res.ok) throw new GovInfoError(`Federal Register error ${res.status}`)
  return (await res.json()) as T
}

function frAgencyNames(row: Raw): string {
  const list: Raw[] = Array.isArray(row.agencies) ? row.agencies : []
  if (list.length === 0) return "agency not reported"
  const shown = list.slice(0, 3).map((a) => String(a.name ?? "?")).join(", ")
  return list.length > 3 ? `${shown}, +${list.length - 3} more` : shown
}

export async function federalRegisterSearch(args: {
  query: string
  type?: string
  agency?: string
  publishedAfter?: string
  limit?: number
}): Promise<string> {
  const term = (args.query ?? "").trim()
  if (!term) throw new GovInfoError("Search text is empty.")
  const limit = Math.min(Math.max(args.limit ?? 5, 1), 20)
  const type = (args.type ?? "").trim()
  const agency = (args.agency ?? "").trim()
  const after = (args.publishedAfter ?? "").trim()
  if (after && !/^\d{4}-\d{2}-\d{2}$/.test(after)) throw new GovInfoError(`publishedAfter must be YYYY-MM-DD, got "${after}".`)
  const params: Array<[string, string]> = [
    ["per_page", String(limit)],
    ["order", "relevance"],
    ["conditions[term]", term],
  ]
  if (type) params.push(["conditions[type][]", type])
  if (agency) params.push(["conditions[agencies][]", agency])
  if (after) params.push(["conditions[publication_date][gte]", after])
  for (const field of ["title", "type", "publication_date", "agencies", "html_url", "document_number"]) {
    params.push(["fields[]", field])
  }
  const data = await frSearch<Raw>(params)
  const rows: Raw[] = Array.isArray(data.results) ? data.results : []
  if (rows.length === 0) return `No Federal Register documents for "${term}".`
  const where = [type ? `type ${type}` : "", agency ? `agency ${agency}` : "", after ? `published on/after ${after}` : ""].filter(Boolean).join(", ")
  return [
    `Federal Register matches for "${term}"${where ? ` (${where})` : ""} - ${Number(data.count ?? 0).toLocaleString()} total, showing ${rows.length}:`,
    ...rows.map((r, i) => [
      `${i + 1}. [${r.document_number ?? "?"}] ${r.title ?? "(untitled)"}`,
      `   ${r.type ?? "type not reported"} · published ${r.publication_date ?? "not reported"} · ${frAgencyNames(r)}`,
      r.html_url ? `   ${r.html_url}` : "",
    ].filter(Boolean).join("\n")),
  ].join("\n")
}

export async function federalRegisterDocument(args: { documentNumber: string }): Promise<string> {
  const num = (args.documentNumber ?? "").trim()
  if (!/^\d{4}-\d{5}$/.test(num)) throw new GovInfoError(`Document number must look like 2026-19815, got "${num}".`)
  const params: Array<[string, string]> = []
  for (const field of ["title", "abstract", "type", "publication_date", "effective_on", "html_url", "action", "cfr_references", "agencies", "docket_ids", "regulation_id_numbers"]) {
    params.push(["fields[]", field])
  }
  const res = await fetch(`${FR_BASE}/documents/${encodeURIComponent(num)}.json?${new URLSearchParams(params).toString()}`, {
    headers: { "User-Agent": "govinfo-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(25000),
  })
  if (res.status === 404) throw new GovInfoError(`No Federal Register document numbered ${num}.`)
  if (res.status === 429) throw new GovInfoError("Federal Register rate limit reached, try again shortly.")
  if (!res.ok) throw new GovInfoError(`Federal Register error ${res.status}`)
  const d = (await res.json()) as Raw
  const flat = (value: unknown): string => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "")
  const cfr: Raw[] = Array.isArray(d.cfr_references) ? d.cfr_references : []
  const dockets: string[] = Array.isArray(d.docket_ids) ? d.docket_ids.map(String) : []
  const rins: string[] = Array.isArray(d.regulation_id_numbers) ? d.regulation_id_numbers.map(String) : []
  const more = (n: number) => (n > 0 ? `, +${n} more` : "")
  return [
    `[${num}] ${d.title ?? "(untitled)"}`,
    `${d.type ?? "type not reported"} · published ${d.publication_date ?? "not reported"}${d.effective_on ? ` · effective ${d.effective_on}` : ""}`,
    `Agencies: ${frAgencyNames(d)}`,
    cfr.length ? `CFR citations: ${cfr.slice(0, 8).map((c) => String(c.part ?? c.heading ?? "?")).join(", ")}${more(cfr.length - 8)}` : "CFR citations: not reported",
    dockets.length ? `Docket ids: ${dockets.slice(0, 5).join(", ")}${more(dockets.length - 5)}` : "",
    rins.length ? `RIN: ${rins.slice(0, 5).join(", ")}${more(rins.length - 5)}` : "",
    flat(d.abstract) ? `Abstract: ${flat(d.abstract).slice(0, 700)}` : "Abstract: not reported",
    flat(d.action) ? `Action: ${flat(d.action).slice(0, 400)}` : "",
    d.html_url ? `Full text: ${d.html_url}` : "",
  ].filter(Boolean).join("\n")
}

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
