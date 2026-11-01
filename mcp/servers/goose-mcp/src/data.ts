import { readFileSync } from "node:fs"

export interface Meta {
  language: string
  repo: string
  site: string
  commit: string
  docs: number
  symbols: number
  keywords: number
  samples: number
  sources: string[]
}

export interface Section {
  id: string
  doc: string
  docTitle: string
  title: string
  level: number
  text: string
}

export interface Symbol {
  module: string
  kind: string
  name: string
  signature: string
}

export interface Keyword {
  word: string
  kind: string
}

export interface OperatorRow {
  level: string
  operators: string[]
}

export interface Sample {
  name: string
  path: string
  bytes: number
  code: string
}

function load<T>(file: string): T {
  const url = new URL(`../data/${file}`, import.meta.url)
  return JSON.parse(readFileSync(url, "utf8")) as T
}

export const meta: Meta = load<Meta>("meta.json")
export const sections: Section[] = load<Section[]>("docs.json")
export const symbols: Symbol[] = load<Symbol[]>("symbols.json")
export const keywords: Keyword[] = load<Keyword[]>("keywords.json")
export const operatorRows: OperatorRow[] = load<OperatorRow[]>("operators.json")
export const samples: Sample[] = load<Sample[]>("samples.json")

export interface DocGroup {
  doc: string
  docTitle: string
  count: number
}

/** Doc groups in the order the source documents are registered. */
export const docGroups: DocGroup[] = (() => {
  const order: string[] = []
  const titles = new Map<string, string>()
  const counts = new Map<string, number>()
  for (const s of sections) {
    if (!counts.has(s.doc)) {
      order.push(s.doc)
      titles.set(s.doc, s.docTitle)
      counts.set(s.doc, 0)
    }
    counts.set(s.doc, (counts.get(s.doc) ?? 0) + 1)
  }
  return order.map((doc) => ({
    doc,
    docTitle: titles.get(doc) ?? doc,
    count: counts.get(doc) ?? 0,
  }))
})()

export function findSection(id: string): Section | undefined {
  const wanted = id.trim().toLowerCase()
  return sections.find((s) => s.id.toLowerCase() === wanted)
}

export function sectionsOfDoc(doc: string): Section[] {
  const wanted = doc.trim().toLowerCase()
  return sections.filter(
    (s) => s.doc.toLowerCase() === wanted || s.docTitle.toLowerCase() === wanted
  )
}

export interface SectionMatch {
  section: Section
  snippet: string
  titleHit: boolean
}

/** Case-insensitive search over section titles and bodies; title hits rank first. */
export function searchSections(query: string, limit: number): SectionMatch[] {
  const needle = query.trim().toLowerCase()
  if (needle === "") return []
  const matches: SectionMatch[] = []
  for (const s of sections) {
    const titleHit = s.title.toLowerCase().includes(needle)
    const textHit = s.text.toLowerCase().includes(needle)
    if (!titleHit && !textHit) continue
    matches.push({
      section: s,
      snippet: titleHit ? snippet(s.text, "", 260) : snippet(s.text, query, 320),
      titleHit,
    })
  }
  matches.sort((a, b) => Number(b.titleHit) - Number(a.titleHit))
  return matches.slice(0, limit)
}

/** A short window of `text` around the first case-insensitive hit of `query`. */
export function snippet(text: string, query: string, radius: number): string {
  const flat = text.replace(/\s+/g, " ").trim()
  const needle = query.trim().toLowerCase()
  if (needle === "") {
    return flat.length > radius ? `${flat.slice(0, radius)}…` : flat
  }
  const at = flat.toLowerCase().indexOf(needle)
  if (at < 0) {
    return flat.length > radius ? `${flat.slice(0, radius)}…` : flat
  }
  const start = Math.max(0, at - Math.floor(radius / 2))
  const end = Math.min(flat.length, at + needle.length + Math.floor(radius / 2))
  const head = start > 0 ? "…" : ""
  const tail = end < flat.length ? "…" : ""
  return `${head}${flat.slice(start, end)}${tail}`
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, max)}\n\n[truncated at ${max} chars — full text is ${text.length} chars]`
}

export interface ModuleSummary {
  module: string
  count: number
  kinds: string[]
}

/** Stdlib modules sorted by symbol count, largest first. */
export function moduleSummaries(): ModuleSummary[] {
  const counts = new Map<string, number>()
  const kinds = new Map<string, Set<string>>()
  for (const s of symbols) {
    counts.set(s.module, (counts.get(s.module) ?? 0) + 1)
    const set = kinds.get(s.module) ?? new Set<string>()
    set.add(s.kind)
    kinds.set(s.module, set)
  }
  return [...counts.entries()]
    .map(([module, count]) => ({
      module,
      count,
      kinds: [...(kinds.get(module) ?? new Set<string>())].sort(),
    }))
    .sort((a, b) => b.count - a.count || a.module.localeCompare(b.module))
}

export function lookupSymbol(name: string): Symbol[] {
  const wanted = name.trim().toLowerCase()
  if (wanted === "") return []
  return symbols.filter((s) => s.name.toLowerCase() === wanted)
}

export function searchSymbols(query: string, module: string | undefined, limit: number): Symbol[] {
  const needle = query.trim().toLowerCase()
  const mod = module?.trim().toLowerCase() ?? ""
  if (needle === "") return []
  return symbols
    .filter((s) => (mod === "" ? true : s.module.toLowerCase() === mod))
    .filter(
      (s) =>
        s.name.toLowerCase().includes(needle) || s.signature.toLowerCase().includes(needle)
    )
    .slice(0, limit)
}

export function symbolsInModule(module: string): Symbol[] {
  const wanted = module.trim().toLowerCase()
  return symbols.filter((s) => s.module.toLowerCase() === wanted)
}

export function findSample(name: string): Sample | undefined {
  const wanted = name.trim().toLowerCase()
  const withExt = wanted.endsWith(".goose") ? wanted : `${wanted}.goose`
  return (
    samples.find((s) => s.name.toLowerCase() === wanted) ??
    samples.find((s) => s.name.toLowerCase() === withExt) ??
    samples.find((s) => s.name.toLowerCase().includes(wanted))
  )
}

export interface SampleMatch {
  sample: Sample
  snippet: string
}

export function searchSamples(query: string, limit: number): SampleMatch[] {
  const needle = query.trim()
  if (needle === "") return []
  const lower = needle.toLowerCase()
  const out: SampleMatch[] = []
  for (const s of samples) {
    if (!s.code.toLowerCase().includes(lower)) continue
    out.push({ sample: s, snippet: snippet(s.code, needle, 300) })
    if (out.length >= limit) break
  }
  return out
}

export function formatOperatorTable(): string {
  if (operatorRows.length === 0) return "No operator table in the bundled data."
  const lines = operatorRows.map(
    (row, i) =>
      `${i + 1}. ${row.level}: ${row.operators
        .map((o) => `\`${o.replace(/\\\|/g, "|")}\``)
        .join(" ")}`
  )
  return [
    "Operator precedence, tightest binding first (precedence is Rust's):",
    "",
    ...lines,
    "",
    "Separate statement forms, not part of the table: assignment `=`, `.=`, the compound form of every binary operator (`+=`, `<<=`, `&=`, …), `++` and `--` on integer lvalues. A range `a..b` appears only in slicing brackets, `for` headers and match arms.",
  ].join("\n")
}
