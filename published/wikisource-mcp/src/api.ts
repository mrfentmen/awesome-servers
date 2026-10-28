const API = "https://en.wikisource.org/w/api.php"
const HEADERS = { "User-Agent": "mrfentmen-wikisource-mcp/1.0" }

export class WikisourceError extends Error {}

async function get(params: Record<string, string>) {
  const url = new URL(API)
  Object.entries({ ...params, format: "json", origin: "*" }).forEach(([key, value]) => url.searchParams.set(key, value))
  const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(30000) })
  if (!response.ok) throw new WikisourceError(`Wikisource error ${response.status}`)
  return response.json() as Promise<unknown>
}

export function searchTitles(query: string, limit = 10) {
  return get({ action: "query", list: "search", srsearch: query, srlimit: String(limit), srnamespace: "0", srprop: "snippet|timestamp" })
}

export function extract(title: string, introOnly: boolean, limit: number) {
  return get({ action: "query", prop: "extracts|info", explaintext: "1", ...(introOnly ? { exintro: "1" } : {}), exchars: String(limit), titles: title, inprop: "url" })
}

export function format(value: unknown): string { return JSON.stringify(value, null, 2).slice(0, 16000) }
