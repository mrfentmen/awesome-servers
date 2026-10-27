const BASE = "https://datatracker.ietf.org/api/v1"
const HEADERS = { "User-Agent": "mrfentmen-ietf-mcp/1.0" }

export class IetfError extends Error {}

async function get(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${BASE}/${path}`)
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value))
  const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(30000) })
  if (!response.ok) throw new IetfError(`IETF Datatracker error ${response.status}`)
  return response.json() as Promise<unknown>
}

export function searchDocuments(query: string, limit = 10, offset = 0) {
  return get("doc/document/", { name: query, limit: String(limit), offset: String(offset) })
}

export function getDocument(name: string) {
  return get("doc/document/", { name, limit: "1" })
}

export function searchGroups(query: string, limit = 10) {
  return get("group/group/", { name: query, limit: String(limit), offset: "0" })
}

export function listMeetings(limit = 10) {
  return get("meeting/meeting/", { limit: String(limit), offset: "0" })
}

export function format(value: unknown): string { return JSON.stringify(value, null, 2).slice(0, 16000) }
