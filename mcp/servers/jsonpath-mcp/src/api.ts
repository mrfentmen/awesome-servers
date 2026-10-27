/**
 * JSONPath — keyless public API client.
 */
const BASE = "https://example.invalid"
const SOURCE = "JSONPath"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "jsonpath-mcp", accept },
    })
    if (!res.ok) throw new SourceError(`${SOURCE} responded ${res.status}`)
    return res
  } catch (e) {
    if (e instanceof SourceError) throw e
    if ((e as Error).name === "AbortError") throw new SourceError(`${SOURCE} request timed out`)
    throw new SourceError(`${SOURCE} request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

export async function getJson(path: string): Promise<any> {
  const res = await request(path)
  const body = await res.text()
  try {
    return JSON.parse(body)
  } catch {
    throw new SourceError(`${SOURCE} returned malformed JSON`)
  }
}

export async function getText(path: string, accept = "text/plain"): Promise<string> {
  const res = await request(path, accept)
  return (await res.text()).trim()
}

export function clampLimit(n: number | undefined, fallback: number, max: number): number {
  const v = n ?? fallback
  if (!Number.isInteger(v) || v < 1 || v > max) throw new SourceError(`limit must be between 1 and ${max}`)
  return v
}

export function clean(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim()
}

export function bullet(label: string, value: unknown): string {
  const v = value === undefined || value === null || value === "" ? "" : String(value)
  return v ? `${label}: ${v}` : ""
}

export function section(title: string, rows: string[]): string {
  return [title, ...rows.filter(Boolean)].join("\n")
}

type Seg = { kind: "key"; key: string } | { kind: "index"; index: number } | { kind: "wild" } | { kind: "descend"; key: string } | { kind: "slice"; start: number; end: number }

function parsePath(path: string): Seg[] {
  let p = path.trim()
  if (!p.startsWith("$")) throw new SourceError('JSONPath must start with $')
  p = p.slice(1)
  const segs: Seg[] = []
  let i = 0
  while (i < p.length) {
    if (p.startsWith("..", i)) {
      i += 2
      const m = p.slice(i).match(/^([A-Za-z_$][\w$-]*|\*)/)
      if (!m) throw new SourceError("recursive descent needs a key or * after ..")
      segs.push(m[1] === "*" ? { kind: "descend", key: "*" } : { kind: "descend", key: m[1] })
      i += m[1].length
      continue
    }
    if (p[i] === ".") {
      i++
      const m = p.slice(i).match(/^([A-Za-z_$][\w$-]*|\*)/)
      if (!m) throw new SourceError("expected a key after .")
      segs.push(m[1] === "*" ? { kind: "wild" } : { kind: "key", key: m[1] })
      i += m[1].length
      continue
    }
    if (p[i] === "[") {
      const end = p.indexOf("]", i)
      if (end < 0) throw new SourceError("unclosed [ in JSONPath")
      const inner = p.slice(i + 1, end).trim()
      if (inner === "*") segs.push({ kind: "wild" })
      else if (/^-?\d+$/.test(inner)) segs.push({ kind: "index", index: Number(inner) })
      else if (/^'.*'$/.test(inner) || /^".*"$/.test(inner)) segs.push({ kind: "key", key: inner.slice(1, -1) })
      else if (/^-?\d*:-?\d*$/.test(inner)) {
        const [s, e] = inner.split(":")
        segs.push({ kind: "slice", start: s ? Number(s) : 0, end: e ? Number(e) : Number.MAX_SAFE_INTEGER })
      } else throw new SourceError(`unsupported bracket expression [${inner}]`)
      i = end + 1
      continue
    }
    throw new SourceError(`unexpected character ${JSON.stringify(p[i])} in JSONPath`)
  }
  return segs
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v)

function walk(node: unknown, seg: Seg): unknown[] {
  if (seg.kind === "descend") {
    const out: unknown[] = []
    const visit = (v: unknown): void => {
      if (seg.key === "*") out.push(v)
      else if (isObject(v) && seg.key in v) out.push(v[seg.key])
      if (isObject(v)) for (const k of Object.keys(v)) visit(v[k])
      else if (Array.isArray(v)) for (const item of v) visit(item)
    }
    visit(node)
    return out
  }
  if (seg.kind === "wild") {
    if (Array.isArray(node)) return node
    if (isObject(node)) return Object.values(node)
    return []
  }
  if (seg.kind === "key") {
    if (isObject(node) && seg.key in node) return [node[seg.key]]
    return []
  }
  if (seg.kind === "index") {
    if (!Array.isArray(node)) return []
    const idx = seg.index < 0 ? node.length + seg.index : seg.index
    return idx >= 0 && idx < node.length ? [node[idx]] : []
  }
  if (!Array.isArray(node)) return []
  return node.slice(seg.start, seg.end === Number.MAX_SAFE_INTEGER ? undefined : seg.end)
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch (e) {
    throw new SourceError(`invalid JSON: ${(e as Error).message}`)
  }
}

function evaluate(doc: unknown, path: string): unknown[] {
  let nodes = [doc]
  for (const seg of parsePath(path)) nodes = nodes.flatMap((n) => walk(n, seg))
  return nodes
}

const preview = (v: unknown): string => {
  const s = typeof v === "string" ? JSON.stringify(v) : JSON.stringify(v)
  return s.length > 400 ? s.slice(0, 400) + "…" : s
}

export async function queryJsonpath(a: { json: string; path: string }): Promise<string> {
  const doc = parseJson(a.json)
  const matches = evaluate(doc, a.path)
  if (matches.length === 0) return `No matches for ${a.path}`
  return [`${matches.length} match${matches.length === 1 ? "" : "es"} for ${a.path}:`, ...matches.slice(0, 50).map((m, i) => `${i + 1}. ${preview(m)}`)].join("\n")
}

export async function listJsonPaths(a: { json: string; maxDepth: number }): Promise<string> {
  const doc = parseJson(a.json)
  const out: string[] = []
  const walkAll = (v: unknown, path: string, depth: number): void => {
    if (depth > a.maxDepth) return
    if (Array.isArray(v)) {
      if (v.length === 0) out.push(`${path} (empty array)`)
      v.forEach((item, i) => walkAll(item, `${path}[${i}]`, depth + 1))
      return
    }
    if (isObject(v)) {
      const keys = Object.keys(v)
      if (!keys.length) out.push(`${path} (empty object)`)
      for (const k of keys) walkAll(v[k], `${path}.${k}`, depth + 1)
      return
    }
    out.push(`${path} = ${preview(v)}`)
  }
  walkAll(doc, "$", 0)
  return [`${out.length} paths:`, ...out.slice(0, 200)].join("\n")
}

export async function countJsonpath(a: { json: string; path: string }): Promise<string> {
  const matches = evaluate(parseJson(a.json), a.path)
  return `${a.path} matches ${matches.length} node${matches.length === 1 ? "" : "s"}.`
}
