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

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new DoabError(`Set the ${name} environment variable.`)
  return v
}

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

const DOAB_BASE = "https://directory.doabooks.org/rest"

class DoabBrowseError extends Error {}

/**
 * DOAB is a directory of open-access books, so its real structure is the set
 * of communities and collections it groups them into - a hierarchy the search
 * and item tools never touch.
 */
export async function browseDirectory(args: { kind?: string; parent?: string; limit?: number }): Promise<string> {
  const kind = (args.kind ?? "collections").trim().toLowerCase()
  if (!["collections", "communities"].includes(kind)) {
    throw new DoabBrowseError("kind must be collections or communities")
  }
  const limit = Math.max(1, Math.min(args.limit ?? 20, 200))
  const parent = (args.parent ?? "").trim()
  const url = parent ? `${DOAB_BASE}/${kind}/${encodeURIComponent(parent)}` : `${DOAB_BASE}/${kind}`
  const res = await fetch(url, {
    headers: { "User-Agent": "awesome-mcps/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new DoabBrowseError(`DOAB returned ${res.status} for /${kind}${parent ? `/${parent}` : ""}`)
  const rows = (await res.json()) as Array<Record<string, unknown>>
  const list = Array.isArray(rows) ? rows : []
  if (!list.length) {
    return `DOAB has no top-level ${kind}${parent ? ` under "${parent}"` : ""}.`
  }
  const shown = list.slice(0, limit)
  return [
    `DOAB ${kind}${parent ? ` under "${parent}"` : ""} (${list.length} total, ${shown.length} shown):`,
    ...shown.map((row, i) => {
      const name = row.name ?? "(unnamed)"
      const handle = row.handle ?? "no handle"
      const parentName = (row.parentCollection as Record<string, unknown> | null)?.name ?? (row.parentCommunity as Record<string, unknown> | null)?.name
      return `${i + 1}. [${row.type ?? "?"}] ${name}\n   handle ${handle}${parentName ? ` | in ${parentName}` : ""}`
    }),
  ].join("\n")
}

/** One DOAB item with its metadata expanded, so you get the fields, not just the stub. */
export async function itemMetadata(args: { handle?: string }): Promise<string> {
  const raw = (args.handle ?? "").trim()
  if (!raw) throw new DoabBrowseError("Provide a DOAB handle like 20.500.12854/70295, which the search results report")
  if (!/^[\w.-]+\/[\w.-]+$/.test(raw)) throw new DoabBrowseError(`"${raw}" is not a DOAB handle of the form prefix/suffix`)
  // DSpace rejects an encoded %2F in the path, so split the handle on the slash
  // and escape each half on its own.
  const [prefix, suffix] = raw.split("/")
  const url = `${DOAB_BASE}/handle/${encodeURIComponent(prefix)}/${encodeURIComponent(suffix)}?expand=metadata,parentCollection,parentCollectionList,parentCommunityList`
  const res = await fetch(url, {
    headers: { "User-Agent": "awesome-mcps/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(25000),
  })
  if (res.status === 404) return `DOAB has no item with handle ${raw}`
  if (!res.ok) throw new DoabBrowseError(`DOAB returned ${res.status} for handle ${raw}`)
  const row = (await res.json()) as Record<string, any>
  if (!row || row.type !== "item") return `DOAB handle ${raw} is a ${row?.type ?? "unknown"} type, not an item.`
  const meta = (Array.isArray(row.metadata) ? row.metadata : []) as Array<Record<string, any>>
  const field = (key: string): string => {
    const hit = meta.find((m) => m?.key === key)
    const value = hit?.value
    if (value === undefined || value === null || value === "") return ""
    const text = Array.isArray(value) ? value.map((v) => String(v?.value ?? v)).join("; ") : String(value)
    return text.length > 400 ? `${text.slice(0, 400)}...` : text
  }
  const collections = ((row.parentCollectionList as Record<string, any>[] | undefined) ?? []).map((c) => c?.name).filter(Boolean)
  const communities = ((row.parentCommunityList as Record<string, any>[] | undefined) ?? []).map((c) => c?.name).filter(Boolean)
  const lines = [
    `${row.name ?? "Untitled"}`,
    `Handle: ${row.handle ?? raw} | type: ${row.type ?? "item"} | uuid: ${row.uuid ?? "not reported"}`,
    field("dc.title") ? `Title: ${field("dc.title")}` : null,
    field("dc.contributor.author") ? `Author: ${field("dc.contributor.author")}` : null,
    field("dc.date.issued") ? `Published: ${field("dc.date.issued")}` : null,
    field("dc.language.iso") ? `Language: ${field("dc.language.iso")}` : null,
    field("dc.description.abstract") ? `Abstract: ${field("dc.description.abstract")}` : null,
    field("dcterms.license") ? `License: ${field("dcterms.license")}` : null,
    field("dc.publisher") ? `Publisher: ${field("dc.publisher")}` : null,
    collections.length ? `Collections: ${collections.join("; ")}` : null,
    communities.length ? `Communities: ${communities.join("; ")}` : null,
    meta.length ? `Metadata fields present: ${meta.length}` : "Metadata fields present: none",
  ]
  return lines.filter(Boolean).join("\n")
}
