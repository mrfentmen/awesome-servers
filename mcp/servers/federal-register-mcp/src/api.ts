const BASE = "https://www.federalregister.gov/api/v1"
const HEADERS = { "User-Agent": "mrfentmen-federal-register-mcp/1.0" }

export class FederalRegisterError extends Error {}

async function get(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${BASE}/${path}`)
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value))
  const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(30000) })
  if (!response.ok) throw new FederalRegisterError(`Federal Register error ${response.status}`)
  return response.json()
}

export function searchDocuments(term?: string, type?: string, fromDate?: string, toDate?: string, page = 1, perPage = 10) {
  const params: Record<string, string> = { page: String(page), per_page: String(perPage), order: "newest" }
  if (term) params["conditions[term]"] = term
  if (type) params["conditions[type][]"] = type
  if (fromDate) params["conditions[publication_date][gte]"] = fromDate
  if (toDate) params["conditions[publication_date][lte]"] = toDate
  return get("documents.json", params)
}

export function getDocument(documentNumber: string) {
  return get(`documents/${encodeURIComponent(documentNumber)}.json`)
}

export function listAgencies() { return get("agencies.json") }

export function format(value: unknown): string { return JSON.stringify(value, null, 2).slice(0, 16000) }

// ---- muxA tools:
// The existing tools search documents, read one and list agencies, each as raw
// JSON. These ask two different questions of the same API: which documents are
// open for public comment right now, and how the catalogue splits by type.
const TYPES = ["RULE", "PRORULE", "NOTICE", "PRESDOCU"]
/** The API reports this as the count once the true total is larger. */
const COUNT_CAP = 10000

interface SlimDocument {
  document_number?: string
  title?: string
  type?: string
  comments_close_on?: string | null
  html_url?: string
  agencies?: Array<{ name?: string }>
}

/**
 * The path helper in this file sets each parameter once, and this API needs the
 * same fields[] key repeated, so the query is built here instead.
 */
async function getWithFields(params: Array<[string, string]>): Promise<any> {
  const url = new URL(`${BASE}/documents.json`)
  for (const [key, value] of params) url.searchParams.append(key, value)
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(30000) })
  if (!res.ok) throw new FederalRegisterError(`Federal Register error ${res.status}`)
  return res.json()
}

export interface CommentPeriodsArgs {
  days?: number
  limit?: number
  type?: string
}

export interface DocumentCountsArgs {
  term: string
}

export async function documentCounts(args: DocumentCountsArgs): Promise<string> {
  const term = (args.term ?? "").trim()
  if (!term) throw new FederalRegisterError("Provide a search term, like bears.");
  const lines = [`Federal Register documents matching "${term}", by type:`];
  for (const type of TYPES) {
    const d = await getWithFields([
      ["per_page", "20"],
      ["conditions[term]", term],
      ["conditions[type][]", type],
    ])
    const count = typeof d?.count === "number" ? d.count : null
    const shown = count === null ? "unknown" : count >= COUNT_CAP ? `${COUNT_CAP} or more` : String(count)
    lines.push(`  ${type}: ${shown}`);
  }
  lines.push(`Counts of ${COUNT_CAP} mean the API caps its match count there, so the real figure is at least that.`);
  return lines.join("\n");
}
