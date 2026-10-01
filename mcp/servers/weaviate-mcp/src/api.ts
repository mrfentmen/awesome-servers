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

const WV_PRIMITIVES = new Set([
  "text", "string", "int", "number", "boolean", "date", "uuid", "blob",
  "text[]", "string[]", "int[]", "number[]", "boolean[]", "date[]", "uuid[]", "blob[]",
  "object",
])

const WV_TOKENIZATIONS = new Set([
  "word", "lowercase", "whitespace", "field", "trigram", "gse", "kagome_kr", "kagome_ja", "gse_ch",
])

const WV_CAMEL = /^[A-Z][A-Za-z0-9]*$/

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

function wvProblems(cls: SchClass, known: Set<string>): string[] {
  const out: string[] = []
  const name = cls.class ?? "(unnamed)"
  if (!cls.class) out.push("class has no name")
  else if (!WV_CAMEL.test(cls.class)) {
    out.push(`"${cls.class}" is not CamelCase; Weaviate asks for concatenated CamelCase class names such as ArticleAuthor`)
  }
  const named = cls.vectorConfig !== undefined
  if (named && (cls.vectorizer !== undefined || cls.vectorIndexType !== undefined || cls.vectorIndexConfig !== undefined)) {
    out.push("uses both vectorConfig and the class-level vectorizer/vectorIndexType fields; Weaviate says to use one or the other")
  }
  if (named) {
    for (const [vName, cfg] of Object.entries(cls.vectorConfig ?? {})) {
      if (!cfg || typeof cfg !== "object") out.push(`named vector "${vName}" has no config object`)
      else if (!cfg.vectorIndexType) out.push(`named vector "${vName}" has no vectorIndexType, so it falls back to the server default`)
    }
  }
  if (cls.vectorizer !== undefined && cls.vectorizer !== "none") {
    const mods = Object.keys(cls.moduleConfig ?? {})
    if (!mods.includes(cls.vectorizer)) {
      out.push(`vectorizer is "${cls.vectorizer}" but moduleConfig has no "${cls.vectorizer}" block, so module defaults apply`)
    }
    for (const mod of mods) {
      if (mod !== cls.vectorizer) out.push(`moduleConfig has "${mod}" but the collection vectorizer is "${cls.vectorizer}"; the other module is configured but not used`)
    }
  }
  if (cls.vectorizer === "none" && !named) {
    out.push("vectorizer is none, so every object has to be imported with its own vector")
  }
  const inv = cls.invertedIndexConfig
  if (inv) {
    const b = inv.bm25
    if (b) {
      if (typeof b.k1 === "number" && b.k1 <= 0) out.push(`invertedIndexConfig.bm25.k1 is ${b.k1}; it controls term-frequency saturation and should be positive`)
      if (typeof b.b === "number" && (b.b < 0 || b.b > 1)) out.push(`invertedIndexConfig.bm25.b is ${b.b}; it is a length-normalisation weight and belongs between 0 and 1`)
    }
    if (inv.stopwords?.preset && inv.stopwordPresets && inv.stopwordPresets.length > 0) {
      out.push("invertedIndexConfig sets both stopwords.preset and stopwordPresets; pick one so the list is unambiguous")
    }
    if (inv.indexNullState) out.push("invertedIndexConfig.indexNullState is on; modern Weaviate uses indexFilterable for null filters")
  }
  const props = Array.isArray(cls.properties) ? cls.properties : []
  if (props.length === 0) out.push("collection has no properties, so there is nothing for BM25 to match or filter on")
  const seen = new Set<string>()
  let textProps = 0
  let dateProps = 0
  for (const p of props) {
    const label = p.name ?? "(unnamed)"
    if (!p.name) out.push("a property has no name")
    else if (seen.has(p.name)) out.push(`property "${p.name}" is defined twice`)
    else seen.add(p.name)
    const types = Array.isArray(p.dataType) ? p.dataType : []
    if (types.length === 0) out.push(`property "${label}" has no dataType, and Weaviate requires one`)
    for (const t of types) {
      if (WV_PRIMITIVES.has(t)) {
        if (t === "text" || t === "string") textProps++
        if (t === "date") dateProps++
      } else if (!known.has(t)) {
        out.push(`property "${label}" has dataType "${t}", which is neither a built-in type nor a collection defined in this schema`)
      }
    }
    if (p.tokenization !== undefined) {
      if (!WV_TOKENIZATIONS.has(p.tokenization)) {
        out.push(`property "${label}" has tokenization "${p.tokenization}", which is not one of ${[...WV_TOKENIZATIONS].join(", ")}`)
      } else if (p.tokenization === "field" && types.length > 0 && !types.every((t) => t === "text" || t === "string")) {
        out.push(`property "${label}" uses field tokenization but is not a text property, which field tokenization only applies to`)
      }
    }
    for (const n of p.nestedProperties ?? []) {
      if (!Array.isArray(n.dataType) || n.dataType.length === 0) out.push(`nested property "${n.name ?? "(unnamed)"}" under "${label}" has no dataType`)
    }
  }
  if (inv?.indexTimestamps && dateProps === 0) {
    out.push("invertedIndexConfig.indexTimestamps is on but no property is a date, so there is nothing to timestamp-index")
  }
  if (inv?.indexTimestamps && textProps > 0) {
    out.push("invertedIndexConfig.indexTimestamps is on; the docs describe it for date properties and text for change tracking, worth confirming it is what you want")
  }
  return out.map((p) => `${name}: ${p}`)
}

export interface WeaviateSchemaArgs {
  schema: string
}

export async function schemaHealth(args: WeaviateSchemaArgs): Promise<string> {
  const classes = wvClasses(args.schema ?? "")
  if (classes.length === 0) return "The schema has no collections in it."
  const known = new Set(classes.map((c) => String(c.class ?? "")))
  const lines: string[] = []
  const all: string[] = []
  for (const c of classes) all.push(...wvProblems(c, known))
  const vec = new Map<string, number>()
  const types = new Map<string, number>()
  let propCount = 0
  for (const c of classes) {
    const key = c.vectorizer ?? (c.vectorConfig ? "named vectors" : "not reported")
    vec.set(key, (vec.get(key) ?? 0) + 1)
    for (const p of c.properties ?? []) {
      propCount++
      for (const t of p.dataType ?? []) types.set(t, (types.get(t) ?? 0) + 1)
    }
  }
  lines.push(`${classes.length} collection(s), ${propCount} propert${propCount === 1 ? "y" : "ies"} checked locally against the Weaviate schema definition.`)
  lines.push(`Vectorizers: ${[...vec.entries()].map(([k, v]) => `${k} (${v})`).join(", ")}`)
  lines.push(`Data types: ${[...types.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => `${k} (${v})`).join(", ")}`)
  lines.push("")
  if (all.length === 0) {
    lines.push("No problems found: every property has a dataType, every cross-reference resolves, the vectorizer and moduleConfig agree, and BM25 settings are in range.")
  } else {
    lines.push(`${all.length} thing(s) to look at:`)
    lines.push(...all.map((p) => `  - ${p}`))
  }
  return lines.join("\n")
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
