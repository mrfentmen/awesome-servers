/**
 * Weaviate REST + GraphQL client. Points at any instance via WEAVIATE_URL
 * (default http://localhost:8080). Optional WEAVIATE_API_KEY (Bearer).
 * Docs: https://weaviate.io/developers/weaviate/api/rest
 */
const BASE = (process.env.WEAVIATE_URL ?? "http://localhost:8080").replace(/\/+$/, "")

export class WeaviateError extends Error {}

function headers(): Record<string, string> {
  const h: Record<string, string> = { "User-Agent": "weaviate-mcp/1.0", Accept: "application/json" }
  if (process.env.WEAVIATE_API_KEY) h.Authorization = `Bearer ${process.env.WEAVIATE_API_KEY as string}`
  return h
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: headers(),
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new WeaviateError("Weaviate refused (401/403). Check WEAVIATE_API_KEY.")
  if (res.status === 404) throw new WeaviateError("Not found. Check WEAVIATE_URL and the class name.")
  if (!res.ok) throw new WeaviateError(`Weaviate error ${res.status}`)
  return (await res.json()) as T
}

async function postJson<T>(path: string, body: Raw): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  })
  if (res.status === 401 || res.status === 403) throw new WeaviateError("Weaviate refused (401/403). Check WEAVIATE_API_KEY.")
  if (!res.ok) {
    const msg = await res.text().catch(() => "")
    throw new WeaviateError(`Weaviate error ${res.status}: ${msg.slice(0, 200)}`)
  }
  return (await res.json()) as T
}

export interface WvClass {
  name: string
  properties: string[]
}

export async function listClasses(): Promise<WvClass[]> {
  const data = await getJson<Raw>("/v1/schema")
  const rows: Raw[] = Array.isArray(data.classes) ? data.classes : []
  return rows.map((c) => ({
    name: String(c.class ?? "?"),
    properties: (Array.isArray(c.properties) ? c.properties : []).map((p: Raw) => String(p.name)).slice(0, 12),
  }))
}

export async function listObjects(className: string, limit = 5): Promise<Raw[]> {
  const data = await getJson<Raw>(`/v1/objects?class=${encodeURIComponent(className)}&limit=${Math.min(Math.max(limit, 1), 100)}`)
  const rows: Raw[] = Array.isArray(data.objects) ? data.objects : []
  return rows.slice(0, limit)
}

export async function graphqlQuery(query: string): Promise<Raw> {
  if (!query.trim()) throw new WeaviateError("Query is empty.")
  const low = query.trim().toLowerCase()
  if (/^\s*(mutation|delete)\b/.test(low)) {
    throw new WeaviateError("Only Get {} queries are allowed through this tool.")
  }
  return await postJson<Raw>("/v1/graphql", { query })
}

export function formatObject(o: Raw, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const props = o.properties && typeof o.properties === "object" ? o.properties as Raw : {}
  const shown = Object.entries(props).slice(0, 6).map(([k, v]) => `${k}: ${JSON.stringify(v)?.slice(0, 80)}`).join(", ")
  return `${prefix}[${String(o.id ?? "?")}] ${shown}`
}

// ---- muxB tools:

type SchProp = {
  name?: string
  dataType?: string[]
  tokenization?: string
  indexFilterable?: boolean
  indexSearchable?: boolean
  indexRangeFilters?: boolean
  indexInverted?: boolean
  moduleConfig?: Record<string, Record<string, unknown>>
  nestedProperties?: SchProp[]
}

type SchClass = {
  class?: string
  description?: string
  vectorizer?: string
  vectorIndexType?: string
  vectorIndexConfig?: Record<string, unknown>
  vectorConfig?: Record<string, { vectorizer?: string; vectorIndexType?: string; vectorIndexConfig?: Record<string, unknown> }>
  moduleConfig?: Record<string, Record<string, unknown>>
  invertedIndexConfig?: {
    cleanupIntervalSeconds?: number
    bm25?: { k1?: number; b?: number }
    stopwords?: { preset?: string; additions?: string[]; removals?: string[] }
    indexTimestamps?: boolean
    indexNullState?: boolean
    usingBlockMaxWAND?: boolean
    stopwordPresets?: string[]
  }
  multiTenancyConfig?: { enabled?: boolean; autoTenantCreation?: boolean }
  properties?: SchProp[]
}

function wvClasses(text: string): SchClass[] {
  const raw = String(text ?? "").trim()
  if (!raw) throw new WeaviateError("Nothing to read. Paste the schema JSON from GET /v1/schema.")
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new WeaviateError("That is not valid JSON. Paste the whole GET /v1/schema response, or the classes array on its own.")
  }
  const list = Array.isArray(parsed)
    ? parsed
    : (parsed as { classes?: unknown }).classes
  if (!Array.isArray(list)) {
    throw new WeaviateError('Expected an object with a "classes" array, or a bare array of classes.')
  }
  return list as SchClass[]
}

export interface WeaviateSchemaArgs {
  schema: string
}

export interface WeaviateDiffArgs {
  before: string
  after: string
}

function wvIndexKeys(c: SchClass): string[] {
  const keys = new Set<string>()
  for (const k of Object.keys(c.invertedIndexConfig ?? {})) keys.add(`invertedIndexConfig.${k}`)
  const b = c.invertedIndexConfig?.bm25
  if (b) for (const k of Object.keys(b)) keys.add(`invertedIndexConfig.bm25.${k}`)
  for (const [k, v] of Object.entries(c.moduleConfig ?? {})) {
    keys.add(`moduleConfig.${k}`)
    for (const kk of Object.keys(v ?? {})) keys.add(`moduleConfig.${k}.${kk}`)
  }
  if (c.vectorizer !== undefined) keys.add("vectorizer")
  if (c.vectorIndexType !== undefined) keys.add("vectorIndexType")
  for (const k of Object.keys(c.vectorConfig ?? {})) keys.add(`vectorConfig.${k}`)
  if (c.multiTenancyConfig?.enabled !== undefined) keys.add("multiTenancyConfig.enabled")
  return [...keys].sort()
}

function wvGet(c: SchClass, path: string): unknown {
  const parts = path.split(".")
  let node: unknown = c
  for (const part of parts) {
    if (node === null || typeof node !== "object") return undefined
    node = (node as Record<string, unknown>)[part]
  }
  return node
}

export async function schemaDiff(args: WeaviateDiffArgs): Promise<string> {
  const before = wvClasses(args.before ?? "")
  const after = wvClasses(args.after ?? "")
  const beforeMap = new Map(before.map((c) => [String(c.class), c]))
  const afterMap = new Map(after.map((c) => [String(c.class), c]))
  const added = [...afterMap.keys()].filter((n) => !beforeMap.has(n))
  const removed = [...beforeMap.keys()].filter((n) => !afterMap.has(n))
  const lines = [
    `Comparing ${before.length} collection(s) before with ${after.length} after.`,
    added.length ? `Added: ${added.join(", ")}` : "Added: none.",
    removed.length ? `Removed: ${removed.join(", ")}` : "Removed: none.",
    "",
  ]
  const breaking: string[] = []
  const changes: string[] = []
  for (const [name, a] of afterMap) {
    const b = beforeMap.get(name)
    if (!b) continue
    const bProps = new Map((b.properties ?? []).map((p) => [String(p.name), p]))
    const aProps = new Map((a.properties ?? []).map((p) => [String(p.name), p]))
    for (const pn of aProps.keys()) if (!bProps.has(pn)) changes.push(`${name}.${pn}: property added`)
    for (const pn of bProps.keys()) if (!aProps.has(pn)) breaking.push(`${name}.${pn}: property removed, so existing data for it becomes unreachable`)
    for (const [pn, ap] of aProps) {
      const bp = bProps.get(pn)
      if (!bp) continue
      const at = JSON.stringify(ap.dataType ?? [])
      const bt = JSON.stringify(bp.dataType ?? [])
      if (at !== bt) breaking.push(`${name}.${pn}: dataType ${bt} -> ${at}; Weaviate does not allow changing a property's data type, so this needs a new property and a backfill`)
      if ((ap.tokenization ?? "word") !== (bp.tokenization ?? "word")) {
        changes.push(`${name}.${pn}: tokenization ${bp.tokenization ?? "word"} -> ${ap.tokenization ?? "word"}, which changes what the keyword search can match`)
      }
      for (const flag of ["indexFilterable", "indexSearchable", "indexRangeFilters", "indexInverted"] as const) {
        if (Boolean(ap[flag]) !== Boolean(bp[flag])) {
          changes.push(`${name}.${pn}: ${flag} ${Boolean(bp[flag])} -> ${Boolean(ap[flag])}`)
        }
      }
    }
    for (const key of wvIndexKeys(a)) {
      const av = JSON.stringify(wvGet(a, key))
      const bv = JSON.stringify(wvGet(b, key))
      if (av !== bv) changes.push(`${name}: ${key} ${bv ?? "(unset)"} -> ${av ?? "(unset)"}`)
    }
  }
  lines.push(`Non-breaking differences (${changes.length}):`)
  if (changes.length === 0) lines.push("  none")
  else lines.push(...changes.slice(0, 40).map((c) => `  - ${c}`))
  lines.push("")
  lines.push(`Differences that break existing data (${breaking.length}):`)
  if (breaking.length === 0) lines.push("  none")
  else lines.push(...breaking.slice(0, 40).map((c) => `  - ${c}`))
  if (breaking.length > 0) lines.push("  Ship the additive changes first, backfill, then drop the old properties.")
  return lines.join("\n")
}
