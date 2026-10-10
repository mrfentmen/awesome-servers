/**
 * Milvus REST API v2 client. Points at any instance via MILVUS_URL
 * (default http://localhost:19530). Optional MILVUS_TOKEN (Bearer).
 * Docs: https://milvus.io/api-reference/restful/
 */
const BASE = (process.env.MILVUS_URL ?? "http://localhost:19530").replace(/\/+$/, "")

export class MilvusError extends Error {}

function headers(): Record<string, string> {
  const h: Record<string, string> = { "User-Agent": "milvus-mcp/1.0", Accept: "application/json", "Content-Type": "application/json" }
  if (process.env.MILVUS_TOKEN) h.Authorization = `Bearer ${process.env.MILVUS_TOKEN as string}`
  return h
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function postJson<T>(path: string, body: Raw = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25000),
  })
  if (res.status === 401 || res.status === 403) throw new MilvusError("Milvus refused (401/403). Check MILVUS_TOKEN.")
  if (res.status === 404) throw new MilvusError("Not found. Check MILVUS_URL.")
  if (!res.ok) {
    const msg = await res.text().catch(() => "")
    throw new MilvusError(`Milvus error ${res.status}: ${msg.slice(0, 200)}`)
  }
  return (await res.json()) as T
}

function checkCode(data: Raw, what: string): void {
  if (typeof data.code === "number" && data.code !== 0 && data.code !== 200) {
    throw new MilvusError(`${what} failed: ${String(data.message ?? data.code)}`)
  }
}

export async function listCollections(): Promise<string[]> {
  const data = await postJson<Raw>("/v2/vectordb/collections/list", {})
  checkCode(data, "List collections")
  const rows: Raw[] = Array.isArray(data.data) ? data.data : []
  return rows.map(String)
}

export async function describeCollection(name: string): Promise<Raw> {
  if (!name.trim()) throw new MilvusError("Collection name is empty.")
  const data = await postJson<Raw>("/v2/vectordb/collections/describe", { collectionName: name.trim() })
  checkCode(data, "Describe collection")
  return (data.data ?? {}) as Raw
}

export async function collectionStats(name: string): Promise<Raw> {
  if (!name.trim()) throw new MilvusError("Collection name is empty.")
  const data = await postJson<Raw>("/v2/vectordb/collections/get_stats", { collectionName: name.trim() })
  checkCode(data, "Collection stats")
  return (data.data ?? {}) as Raw
}

export function formatDescribe(name: string, d: Raw): string {
  const fields: Raw[] = Array.isArray(d.fields) ? d.fields : []
  const lines = [
    `Collection ${name}`,
    d.description ? `${d.description}` : "",
    `Fields: ${fields.map((f) => `${String(f.name)}:${String(f.dataType ?? "?")}`).join(", ") || "(none)"}`,
    d.dimension !== undefined ? `Dimension: ${d.dimension}` : "",
    d.metricType ? `Metric: ${d.metricType}` : "",
  ].filter(Boolean)
  return lines.join("\n")
}

export function formatStats(name: string, d: Raw): string {
  return `Collection ${name}: ${d.row_count ?? "?"} rows${d.indexed ? " (indexed)" : ""}`
}

// ---- muxF tools:
const SCALAR_BYTES: Record<string, number> = {
  FLOAT32: 4,
  FLOAT16: 2,
  INT8: 1,
  BFLOAT16: 2,
  INT16: 2,
  INT32: 4,
  INT64: 8,
  BINARY: 0,
}

const INDEX_NOTES: Record<string, string> = {
  NONE: "no index: the full float payload is held in memory and every query is a scan",
  FLAT: "brute force: the full vector payload plus 8 bytes of id per row",
  IVF_FLAT: "inverted file over uncompressed vectors, plus 4 bytes of row id per vector",
  IVF_SQ8: "inverted file with each vector scaled to a signed byte, plus 4 bytes of row id",
  IVF_PQ: "inverted file with product quantised codes, plus 4 bytes of row id",
  IVF_HNSW: "inverted file over a proximity graph, plus 4 bytes of row id",
  HNSW: "proximity graph over the full vector payload, plus 8 bytes of row id",
  DISKANN: "on disk graph over a quantised payload, plus 8 bytes of row id",
  SCANN: "scan accelerated approximate nearest neighbour, 4 bytes of row id",
}

function bound(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(Math.floor(n), max))
}

function human(bytes: number): string {
  const n = Math.max(0, bytes)
  if (n >= 1024 ** 4) return `${(n / 1024 ** 4).toFixed(2)} TiB`
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(2)} GiB`
  if (n >= 1024 ** 2) return `${(n / 1024 ** 2).toFixed(2)} MiB`
  if (n >= 1024) return `${(n / 1024).toFixed(2)} KiB`
  return `${n} B`
}

/**
 * What a vector collection will cost to hold, worked out from the schema and
 * index parameters rather than read back from a running server.
 */
export async function vectorFootprint(args: {
  dimension?: number
  rows?: number
  dataType?: string
  indexType?: string
  m?: number
  nlist?: number
  subVectors?: number
  bitsPerCode?: number
  primaryKeyBytes?: number
}): Promise<string> {
  const dimension = bound(args.dimension, 1, 65536, 768)
  const rows = bound(args.rows, 1, 1e12, 1_000_000)
  const type = (args.dataType ?? "FLOAT32").toUpperCase()
  if (!(type in SCALAR_BYTES)) {
    throw new MilvusError(`Unknown data type "${args.dataType}". Use one of ${Object.keys(SCALAR_BYTES).join(", ")}.`)
  }
  const index = (args.indexType ?? "HNSW").toUpperCase()
  const m = bound(args.m, 2, 2048, 16)
  const nlist = bound(args.nlist, 1, 1e7, Math.max(1, Math.floor(Math.sqrt(rows))))
  const subVectors = bound(args.subVectors, 1, dimension, Math.max(1, Math.floor(Math.sqrt(dimension))))
  const bitsPerCode = bound(args.bitsPerCode, 1, 32, 8)
  const pkBytes = bound(args.primaryKeyBytes, 0, 64, 8)
  const perDim = SCALAR_BYTES[type]
  const vectorBytes = type === "BINARY" ? Math.ceil(dimension / 8) : dimension * perDim
  const quantised = type === "INT8" || index === "IVF_SQ8" || index === "DISKANN" || index === "IVF_PQ"
  const storedVectorBytes = index === "IVF_PQ" ? Math.ceil((dimension / subVectors) * (bitsPerCode / 8)) : quantised ? Math.ceil(dimension) : vectorBytes
  const graphBytes = index === "HNSW" ? m * 2 * 4 : index === "IVF_HNSW" ? m * 2 * 4 : 0
  const idBytes = index === "HNSW" || index === "DISKANN" ? 8 : 4
  const perRow = storedVectorBytes + graphBytes + idBytes + pkBytes
  const rawTotal = vectorBytes * rows
  const total = perRow * rows
  const overhead = ((perRow / storedVectorBytes - 1) * 100) || 0
  return [
    "Vector collection storage estimate, computed from the schema and index parameters",
    `Assumptions: ${dimension} dimensions, ${rows.toLocaleString()} rows, element type ${type}${type === "BINARY" ? ` (${Math.ceil(dimension / 8)} bytes per vector)` : ` (${perDim} bytes per dimension)`}, index ${index}`,
    `Raw vector payload alone: ${human(vectorBytes)} per vector, ${human(rawTotal)} for the whole collection`,
    `Stored vector payload: ${human(storedVectorBytes)} per vector${index === "IVF_PQ" ? ` (${subVectors} sub-vectors at ${bitsPerCode} bits each)` : quantised ? " (one byte per dimension, quantised)" : " (uncompressed)"}`,
    `Index structure: ${graphBytes ? `${m} neighbours per node, ${human(graphBytes)} per vector` : "no per-vector graph stored for this index type"}`,
    `Row identifier: ${idBytes} bytes, primary key: ${pkBytes} bytes`,
    `Total per row: ${human(perRow)}`,
    `Total collection footprint: ${human(total)}${index === "IVF_FLAT" ? ` (plus a ${human(nlist * 4)} byte posting list for ${nlist} lists)` : ""}`,
    `Overhead above the raw vectors: ${overhead.toFixed(1)}%`,
    `${(total / rows).toFixed(1)} bytes stored per row against ${vectorBytes} bytes of raw data.`,
    `What this index means for queries: ${INDEX_NOTES[index] ?? "not described in this table"}`,
  ].join("\n")
}

const LAYER_DECAY = 1 / Math.log(3)

/** Per-query work for an approximate index, derived from its own parameters. */
export async function searchCost(args: {
  indexType?: string
  numVectors?: number
  dimension?: number
  nlist?: number
  nprobe?: number
  m?: number
  efConstruction?: number
  efSearch?: number
  dataType?: string
}): Promise<string> {
  const index = (args.indexType ?? "HNSW").toUpperCase()
  const n = bound(args.numVectors, 1, 1e12, 1_000_000)
  const dimension = bound(args.dimension, 1, 65536, 768)
  const nlist = bound(args.nlist, 1, 1e7, Math.max(1, Math.floor(Math.sqrt(n))))
  const nprobe = bound(args.nprobe, 1, nlist, Math.max(1, Math.floor(nlist / 10)))
  const m = bound(args.m, 2, 2048, 16)
  const efConstruction = bound(args.efConstruction, 4, 4096, 200)
  const efSearch = bound(args.efSearch, 1, 4096, 64)
  const perDim = SCALAR_BYTES[(args.dataType ?? "FLOAT32").toUpperCase()] ?? 4
  const vectorBytes = dimension * perDim
  const lines = [
    `Approximate search cost for an ${index} index over ${n.toLocaleString()} vectors of ${dimension} dimensions`,
    "These are the consequences of the parameters you gave, not a measured speed.",
  ]
  if (index.startsWith("IVF")) {
    const listSize = n / nlist
    const probed = Math.min(nprobe, nlist)
    const share = (probed * listSize) / n
    lines.push(
      `Lists: ${nlist.toLocaleString()}, so about ${listSize.toFixed(1)} vectors land in each list`,
      `Probing ${probed} of ${nlist} lists scans roughly ${(probed * listSize).toLocaleString()} vectors, ${(share * 100).toFixed(2)}% of the collection`,
      `Upper bound on candidates a query may score: ${(probed * listSize).toFixed(0)}`,
      `Exact search would score all ${n.toLocaleString()}, so this index trades ${share > 0 ? `${(1 / share).toFixed(0)}x` : "an unbounded"} reduction in vectors scored for whatever recall that costs.`,
    )
  } else if (index === "HNSW" || index === "IVF_HNSW") {
    const layers = Math.ceil(Math.log(n) / Math.log(Math.max(2, m)))
    lines.push(
      `M: ${m} bidirectional neighbours per node, so ${m * 2} links per node and ${(m * 2 * 4).toLocaleString()} bytes of links per vector`,
      `Estimated layer count for ${n.toLocaleString()} vectors at M=${m}: ${layers} (levels above the base hold about a ${LAYER_DECAY.toFixed(4)} share each)`,
      `efSearch ${efSearch}: a search keeps a candidate list of that size at the base layer, so it scores on the order of ${efSearch} candidates`,
      `efConstruction ${efConstruction}: an insert explores that many candidates per layer, so indexing is the expensive side`,
      `Scored candidates per query: roughly ${(efSearch * layers).toLocaleString()} across all layers, against ${n.toLocaleString()} for an exact scan`,
      `Graph memory: ${human(m * 2 * 4 * n)} of links, plus ${human(vectorBytes * n)} of vectors`,
    )
  } else {
    lines.push(
      `A ${index} index is scanned rather than probed, so every query touches on the order of ${n.toLocaleString()} vectors.`,
      `Raising nprobe or efSearch does not apply to this index type.`,
    )
  }
  lines.push(
    `Vector payload read per scored candidate: ${human(vectorBytes)}${index === "HNSW" ? `, plus ${human(m * 2 * 4)} of neighbour links per expanded node` : ""}`,
    "Larger nprobe or efSearch buys recall by scoring more candidates, which is the trade the parameter exists to make.",
  )
  return lines.join("\n")
}

function toVector(value: unknown, maxDim: number): number[] {
  if (!Array.isArray(value)) throw new MilvusError("A vector must be an array of numbers.")
  if (value.length === 0) throw new MilvusError("A vector must not be empty.")
  if (value.length > maxDim) throw new MilvusError(`A vector must be at most ${maxDim} dimensions.`)
  return value.map((v) => {
    const n = Number(v)
    if (!Number.isFinite(n)) throw new MilvusError("A vector must contain only finite numbers.")
    return n
  })
}

const METRICS = ["L2", "IP", "COSINE", "HAMMING", "JACCARD"] as const

/** Score real candidate vectors against a query under a chosen metric, so the metric can be compared on real numbers. */
export async function metricProbe(args: {
  metric?: string
  query?: unknown
  candidates?: unknown
  limit?: number
}): Promise<string> {
  const metric = (args.metric ?? "L2").toUpperCase()
  if (!(METRICS as readonly string[]).includes(metric)) {
    throw new MilvusError(`Unknown metric "${args.metric}". Use one of ${METRICS.join(", ")}.`)
  }
  const maxDim = 8192
  const query = toVector(args.query, maxDim)
  if (!Array.isArray(args.candidates) || args.candidates.length === 0) {
    throw new MilvusError("Provide at least one candidate vector.")
  }
  const limit = Math.max(1, Math.min(args.limit ?? 5, 20))
  const scored: Array<{ index: number; value: number; dim: number }> = []
  for (let i = 0; i < Math.min(args.candidates.length, 20); i += 1) {
    const candidate = toVector(args.candidates[i], maxDim)
    if (candidate.length !== query.length) {
      throw new MilvusError(`Candidate ${i} has ${candidate.length} dimensions but the query has ${query.length}.`)
    }
    let value: number
    if (metric === "L2") {
      value = Math.sqrt(query.reduce((sum, q, k) => sum + (q - candidate[k]) ** 2, 0))
    } else if (metric === "IP") {
      value = query.reduce((sum, q, k) => sum + q * candidate[k], 0)
    } else if (metric === "COSINE") {
      const dot = query.reduce((sum, q, k) => sum + q * candidate[k], 0)
      const qn = Math.sqrt(query.reduce((sum, q) => sum + q ** 2, 0))
      const cn = Math.sqrt(candidate.reduce((sum, c) => sum + c ** 2, 0))
      value = qn === 0 || cn === 0 ? NaN : 1 - dot / (qn * cn)
    } else if (metric === "HAMMING") {
      let differing = 0
      for (let k = 0; k < query.length; k += 1) if (query[k] !== candidate[k]) differing += 1
      value = differing
    } else {
      const a = new Set(query.map(String))
      const b = new Set(candidate.map(String))
      let shared = 0
      for (const v of a) if (b.has(v)) shared += 1
      const union = a.size + b.size - shared
      value = union === 0 ? NaN : 1 - shared / union
    }
    if (Number.isFinite(value)) scored.push({ index: i, value, dim: candidate.length })
  }
  if (!scored.length) throw new MilvusError("No candidate produced a finite score under that metric.")
  const ascending = metric === "L2" || metric === "HAMMING" || metric === "JACCARD"
  const ranked = [...scored].sort((a, b) => (ascending ? a.value - b.value : b.value - a.value))
  const skipped = args.candidates.length - scored.length
  return [
    `${metric} scored against a ${query.length} dimension query over ${scored.length} candidate(s)${skipped ? ` (${skipped} skipped for a non-finite score)` : ""}`,
    metric === "IP" || metric === "COSINE"
      ? "For IP and COSINE the closest candidate is the one with the highest score, so the ranking below is descending."
      : `For ${metric} the closest candidate is the one with the lowest score, so the ranking below is ascending.`,
    `Query norm: ${Math.sqrt(query.reduce((s, q) => s + q ** 2, 0)).toFixed(4)}${query.every((q) => q === 0 || q === 1) ? " (the query is binary valued, which fits HAMMING and JACCARD)" : ""}`,
    ...ranked.slice(0, limit).map((r, i) => `${i + 1}. candidate ${r.index}: ${metric} score ${r.value.toFixed(6)}`),
    ranked.length > limit ? `... and ${ranked.length - limit} more candidate(s).` : "",
    `Spread between best and worst: ${(Math.max(...scored.map((s) => s.value)) - Math.min(...scored.map((s) => s.value))).toFixed(6)}`,
  ].filter(Boolean).join("\n")
}
