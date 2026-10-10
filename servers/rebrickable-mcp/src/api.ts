/**
 * Rebrickable API v3 client. Needs REBRICKABLE_API_KEY
 * (free at https://rebrickable.com/api/).
 * Docs: https://rebrickable.com/downloads/
 */
const BASE = "https://rebrickable.com/api/v3"

export class RebrickableError extends Error {}

function apiKey(): string {
  const k = process.env.REBRICKABLE_API_KEY
  if (!k) throw new RebrickableError("Set REBRICKABLE_API_KEY first (free at rebrickable.com/api).")
  return k
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const sep = path.includes("?") ? "&" : "?"
  const res = await fetch(`${BASE}${path}${sep}key=${encodeURIComponent(apiKey())}`, {
    headers: { "User-Agent": "rebrickable-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new RebrickableError("Rebrickable refused (401/403). Check API key.")
  if (res.status === 404) throw new RebrickableError("Not found.")
  if (!res.ok) throw new RebrickableError(`Rebrickable error ${res.status}`)
  return (await res.json()) as T
}

export interface LegoSet {
  number: string
  name?: string
  year?: number
  parts?: number
  image?: string
}

export async function searchSets(query: string, limit = 5): Promise<LegoSet[]> {
  if (!query.trim()) throw new RebrickableError("Query is empty.")
  const data = await getJson<Raw>(`/sets/?search=${encodeURIComponent(query.trim())}&page_size=${Math.min(Math.max(limit, 1), 100)}`)
  const rows: Raw[] = Array.isArray(data.results) ? data.results : []
  return rows.slice(0, limit).map((s) => ({
    number: String(s.set_num),
    name: s.name,
    year: s.year,
    parts: s.num_parts,
    image: s.set_img_url,
  }))
}

export async function getSet(number: string): Promise<string> {
  const clean = number.trim()
  if (!/^[\w-]+$/.test(clean)) throw new RebrickableError(`Not a set number: "${number}". Try like "75192-1".`)
  const s = await getJson<Raw>(`/sets/${encodeURIComponent(clean)}/`)
  const lines = [
    `[${s.set_num ?? clean}] ${s.name ?? "(unnamed)"} (${s.year ?? "?"})`,
    `Parts: ${s.num_parts ?? "?"}`,
    s.set_img_url ? `${s.set_img_url}` : "",
    `More: https://rebrickable.com/sets/${s.set_num ?? clean}/`,
  ].filter(Boolean)
  return lines.join("\n")
}

export async function setParts(number: string, limit = 10): Promise<string[]> {
  const clean = number.trim()
  if (!/^[\w-]+$/.test(clean)) throw new RebrickableError(`Not a set number: "${number}".`)
  const data = await getJson<Raw>(`/sets/${encodeURIComponent(clean)}/parts/?page_size=${Math.min(Math.max(limit, 1), 100)}`)
  const rows: Raw[] = Array.isArray(data.results) ? data.results : []
  return rows.slice(0, limit).map((p) => {
    const part: Raw = p.part ?? {}
    return `${String(part.part_num ?? "?")} x${p.quantity ?? "?"} — ${String(part.name ?? "").slice(0, 80)} (${p.color?.name ?? "?"})`
  })
}

export function formatSet(s: LegoSet, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  return `${prefix}[${s.number}] ${s.name ?? "(unnamed)"}${s.year ? ` (${s.year})` : ""}${s.parts !== undefined ? ` — ${s.parts} parts` : ""}${s.image ? `\n   ${s.image}` : ""}`
}

// ---- muxF tools:
import { gunzipSync } from "node:zlib"

const DOWNLOADS = "https://cdn.rebrickable.com/media/downloads"
const MAX_CSV_BYTES = 12 * 1024 * 1024
const MAX_ROWS = 40000

export class RebrickableDataError extends Error {}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let quoted = false
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i]
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 1
        } else quoted = false
      } else field += c
    } else if (c === '"') quoted = true
    else if (c === ",") {
      row.push(field)
      field = ""
    } else if (c === "\n") {
      row.push(field)
      rows.push(row)
      row = []
      field = ""
    } else if (c !== "\r") field += c
    if (rows.length > MAX_ROWS) break
  }
  if (field !== "" || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

const cache = new Map<string, string[][]>()

async function loadCsv(name: string): Promise<string[][]> {
  const hit = cache.get(name)
  if (hit) return hit
  const res = await fetch(`${DOWNLOADS}/${name}.csv.gz`, {
    headers: { "User-Agent": "rebrickable-mcp/1.0", Accept: "application/gzip" },
    signal: AbortSignal.timeout(60000),
  })
  if (!res.ok) throw new RebrickableDataError(`Rebrickable download ${name}.csv.gz returned ${res.status}`)
  const bytes = new Uint8Array(await res.arrayBuffer())
  if (bytes.byteLength > MAX_CSV_BYTES) {
    throw new RebrickableDataError(`Rebrickable download ${name}.csv.gz is larger than this server will parse`)
  }
  const rows = parseCsv(gunzipSync(Buffer.from(bytes)).toString("utf8"))
  const header = rows.shift() ?? []
  if (!header.length) throw new RebrickableDataError(`Rebrickable download ${name}.csv.gz parsed empty`)
  cache.set(name, rows)
  return rows
}

function bounded(value: unknown, min: number, max: number, fallback: number): number {
  const n = Math.floor(Number(value))
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(n, max))
}

function median(values: number[]): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function hex(rgb: string): string {
  const clean = (rgb ?? "").trim()
  if (!/^[0-9A-Fa-f]{6}$/.test(clean)) return "not reported"
  return `#${clean.toUpperCase()}`
}

let themeIndex: Map<number, { name: string; parent: number | null }> | null = null

async function themes(): Promise<Map<number, { name: string; parent: number | null }>> {
  if (themeIndex) return themeIndex
  const raw = await loadCsv("themes")
  const map = new Map<number, { name: string; parent: number | null }>()
  for (const r of raw) {
    const id = Number(r[0])
    if (!Number.isFinite(id)) continue
    const parent = r[2] ? Number(r[2]) : null
    map.set(id, { name: (r[1] ?? "").trim() || `theme ${id}`, parent: Number.isFinite(parent) ? parent : null })
  }
  themeIndex = map
  return map
}

interface SetRow {
  setNum: string
  name: string
  year: number
  theme: number
  parts: number
}

async function setRows(): Promise<SetRow[]> {
  const raw = await loadCsv("sets")
  const out: SetRow[] = []
  for (const r of raw) {
    if (r.length < 5) continue
    const year = Number(r[2])
    const theme = Number(r[3])
    const parts = Number(r[4])
    out.push({
      setNum: (r[0] ?? "").trim(),
      name: (r[1] ?? "").trim(),
      year: Number.isFinite(year) ? year : 0,
      theme: Number.isFinite(theme) ? theme : -1,
      parts: Number.isFinite(parts) ? parts : 0,
    })
  }
  return out
}

function label(themes: Map<number, { name: string }>, id: number): string {
  return themes.get(id)?.name ?? `theme ${id}`
}

function chain(themes: Map<number, { name: string; parent: number | null }>, id: number): string {
  const parts: string[] = []
  let cursor: number | null = id
  for (let hop = 0; hop < 8 && cursor != null; hop += 1) {
    parts.unshift(themes.get(cursor)?.name ?? `theme ${cursor}`)
    cursor = themes.get(cursor)?.parent ?? null
  }
  return parts.join(" > ")
}

/** How the catalogue is spread over time: sets per decade, parts per set, and which themes fill each decade. */
export async function eraCensus(args: { fromYear?: number; toYear?: number; limit?: number }): Promise<string> {
  const rows = await setRows()
  const tree = await themes()
  const from = bounded(args.fromYear, 1900, 2100, 1950)
  const to = bounded(args.toYear, 1900, 2100, 2026)
  if (to < from) throw new RebrickableDataError("toYear must not be before fromYear.")
  const limit = bounded(args.limit, 1, 12, 5)
  const window = rows.filter((r) => r.year >= from && r.year <= to)
  if (!window.length) return `Rebrickable's set catalogue holds no sets between ${from} and ${to}.`
  const decades = new Map<number, number>()
  const decadeThemes = new Map<number, Map<number, number>>()
  for (const r of window) {
    const decade = Math.floor(r.year / 10) * 10
    decades.set(decade, (decades.get(decade) ?? 0) + 1)
    const byTheme = decadeThemes.get(decade) ?? new Map<number, number>()
    byTheme.set(r.theme, (byTheme.get(r.theme) ?? 0) + 1)
    decadeThemes.set(decade, byTheme)
  }
  const partCounts = window.filter((r) => r.parts > 0).map((r) => r.parts)
  const partMedian = median(partCounts)
  const biggestDecade = [...decades.entries()].sort((a, b) => b[1] - a[1])[0]
  const lines = [
    `Rebrickable set catalogue, ${from} to ${to}`,
    `Sets in that window: ${window.length} of ${rows.length} in the catalogue`,
    `Decades covered: ${decades.size}, busiest ${biggestDecade[0]}s with ${biggestDecade[1].toLocaleString()} set(s)`,
    `Parts per set: median ${partMedian === null ? "not reported" : partMedian.toLocaleString()}, mean ${partCounts.length ? (partCounts.reduce((a, b) => a + b, 0) / partCounts.length).toFixed(0) : "not reported"}, largest ${partCounts.length ? Math.max(...partCounts).toLocaleString() : "not reported"}`,
    `Sets per decade: ${[...decades.entries()].sort((a, b) => a[0] - b[0]).map(([d, n]) => `${d}s ${n}`).join(", ")}`,
  ]
  for (const [decade] of [...decades.entries()].sort((a, b) => a[0] - b[0])) {
    const top = [...(decadeThemes.get(decade) ?? new Map<number, number>())]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
    lines.push(`${decade}s leading themes: ${top.map(([id, n]) => `${label(tree, id)} (${n})`).join(", ")}`)
  }
  return lines.join("\n")
}

/** The theme hierarchy around a theme, with how many sets sit at each level of the tree. */
export async function themeTree(args: { theme?: string; depth?: number; limit?: number }): Promise<string> {
  const needle = (args.theme ?? "").trim()
  if (!needle) return "Provide a theme name, for example Star Wars, Technic or Adventurers."
  const depth = bounded(args.depth, 1, 4, 2)
  const limit = bounded(args.limit, 1, 30, 12)
  const tree = await themes()
  const rows = await setRows()
  const counts = new Map<number, number>()
  for (const r of rows) counts.set(r.theme, (counts.get(r.theme) ?? 0) + 1)
  const lower = needle.toLowerCase()
  const matches = [...tree.entries()].filter(([, t]) => t.name.toLowerCase().includes(lower))
  if (!matches.length) return `Rebrickable's theme list has no theme whose name contains "${needle}".`
  matches.sort((a, b) => a[1].name.length - b[1].name.length || a[1].name.localeCompare(b[1].name))
  const lines = [`Theme hierarchy around "${needle}" (${matches.length} theme name(s) matched):`]
  for (const [id, t] of matches.slice(0, limit)) {
    lines.push(`${t.name} (id ${id})`)
    lines.push(`  path: ${chain(tree, id)}`)
    lines.push(`  sets filed directly under it: ${counts.get(id) ?? 0}`)
    const children = [...tree.entries()].filter(([, c]) => c.parent === id)
    if (children.length) {
      lines.push(`  child themes (${children.length}): ${children.slice(0, limit).map(([cid, c]) => `${c.name} (${counts.get(cid) ?? 0} sets)`).join(", ")}`)
    }
    if (depth >= 2) {
      const grandchildren = children
        .flatMap(([cid]) => [...tree.entries()].filter(([, g]) => g.parent === cid).map(([gid, g]) => ({ gid, g })))
        .slice(0, limit)
      if (grandchildren.length) {
        lines.push(`  grandchildren (${grandchildren.length} shown): ${grandchildren.map(({ gid, g }) => `${g.name} (${counts.get(gid) ?? 0} sets)`).join(", ")}`)
      }
    }
  }
  if (matches.length > limit) lines.push(`... and ${matches.length - limit} more matching theme name(s).`)
  return lines.join("\n")
}

/** The colour table Rebrickable publishes: how common each colour is, its hex, and when it was in use. */
export async function colorRoster(args: { minSets?: number; transparent?: boolean; limit?: number }): Promise<string> {
  const limit = bounded(args.limit, 1, 60, 20)
  const minSets = bounded(args.minSets, 0, 1000000, 0)
  const raw = await loadCsv("colors")
  let rows = raw
    .map((r) => ({
      name: (r[1] ?? "").trim(),
      rgb: r[2] ?? "",
      trans: String(r[3] ?? "").toLowerCase() === "true",
      parts: Number(r[4]) || 0,
      sets: Number(r[5]) || 0,
      y1: Number(r[6]) || 0,
      y2: Number(r[7]) || 0,
    }))
    .filter((c) => c.name)
  if (typeof args.transparent === "boolean") rows = rows.filter((c) => c.trans === args.transparent)
  if (minSets) rows = rows.filter((c) => c.sets >= minSets)
  rows.sort((a, b) => b.sets - a.sets || a.name.localeCompare(b.name))
  if (!rows.length) return "No colours in Rebrickable's table match that filter."
  const rarest = [...rows].sort((a, b) => a.sets - b.sets).slice(0, 3)
  return [
    `Rebrickable colour table: ${raw.length} colours, ${rows.length} after the filter`,
    `Most used (top ${Math.min(limit, rows.length)}):`,
    ...rows.slice(0, limit).map((c) =>
      `- ${c.name} ${hex(c.rgb)}${c.trans ? " (transparent)" : ""}: ${c.sets.toLocaleString()} set(s), ${c.parts.toLocaleString()} part(s)${c.y1 ? `, ${c.y1}-${c.y2}` : ""}`,
    ),
    rarest.length ? `Rarest in this filtered set: ${rarest.map((c) => `${c.name} (${c.sets} set(s))`).join(", ")}` : "",
    "Counts are Rebrickable's own tallies from its published colour table.",
  ].filter(Boolean).join("\n")
}
