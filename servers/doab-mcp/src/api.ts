export class DoabError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DoabError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

async function authHeaders(): Promise<Record<string, string>> {
  return {};
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(url: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(url, { headers: { ...UA, ...(await authHeaders()), ...(init.headers ?? {}) }, ...init })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new DoabError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function searchBooks(query: string): Promise<string> {
  let url = `https://directory.doabooks.org/rest/search`;
  const qs = new URLSearchParams();
  qs.append("query", String(query));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getItem(prefix: string, suffix: string): Promise<string> {
  let url = `https://directory.doabooks.org/rest/handle/${encodeURIComponent(String(prefix))}/${encodeURIComponent(String(suffix))}`;
  const data = await req(url);
  return pretty(data);
}

// ---- muxC tools:

// ---- gap4c1 tools:

interface DirectoryEntry {
  uuid?: string; name?: string; handle?: string; lastModified?: string;
  bundleName?: string; mimeType?: string; sizeBytes?: number; retrieveLink?: string;
}

async function directoryRows(path: string): Promise<DirectoryEntry[]> {
  const res = await fetch(`https://directory.doabooks.org/rest${path}`, {
    headers: { 'User-Agent': 'mrfentmen-doab-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new DoabError(`DOAB returned ${res.status}`)
  const rows = await res.json()
  if (!Array.isArray(rows)) throw new DoabError('DOAB did not return a list.')
  return rows as DirectoryEntry[]
}

function directoryUuid(value: string): string {
  if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value)) throw new DoabError('Provide a DOAB UUID, not a handle.')
  return value
}

export async function collectionItems(args: { collection: string; limit?: number; offset?: number }): Promise<string> {
  const limit = Math.max(1, Math.min(Math.trunc(args.limit ?? 10), 30))
  const offset = Math.max(0, Math.min(Math.trunc(args.offset ?? 0), 100000))
  const rows = await directoryRows(`/collections/${directoryUuid(args.collection)}/items?limit=${limit}&offset=${offset}`)
  if (!rows.length) return 'No collection items returned at this offset.'
  return `DOAB collection items, offset ${offset}:\n` + rows.slice(0, limit).map((r, i) =>
    `${i + 1}. ${(r.name ?? 'not reported').slice(0, 250)}\n   Handle: ${r.handle ?? 'not reported'} | UUID: ${r.uuid ?? 'not reported'} | Modified: ${r.lastModified ?? 'not reported'}`
  ).join('\n')
}

