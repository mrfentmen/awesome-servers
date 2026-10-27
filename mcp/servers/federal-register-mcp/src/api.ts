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
