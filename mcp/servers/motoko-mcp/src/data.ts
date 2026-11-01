import { readFileSync } from "node:fs"

/** Everything below is extracted from the Motoko repos at build time and shipped in `data/`. */

export interface Meta {
  language: string
  repo: string
  site: string
  commit: string
  docs: number
  symbols: number
  samples: number
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

export interface Sample {
  name: string
  path: string
  bytes: number
  code: string
}

function load<T>(file: string): T {
  return JSON.parse(readFileSync(new URL(`../data/${file}`, import.meta.url), "utf8")) as T
}

export const meta: Meta = load<Meta>("meta.json")
export const sections: Section[] = load<Section[]>("docs.json")
export const symbols: Symbol[] = load<Symbol[]>("symbols.json")
export const samples: Sample[] = load<Sample[]>("samples.json")

export const TRUNCATE_AT = 60000

export function truncate(text: string, max: number = TRUNCATE_AT): string {
  if (text.length <= max) return text
  return `${text.slice(0, max)}\n\n[truncated at ${max} chars — section is ${text.length} chars]`
}

/* ------------------------------------------------------------------ docs */

export const sectionsById = new Map<string, Section>(sections.map((s) => [s.id, s]))

export interface DocGroup {
  doc: string
  title: string
  count: number
}

export function docGroups(): DocGroup[] {
  const map = new Map<string, DocGroup>()
  for (const s of sections) {
    const existing = map.get(s.doc)
    if (existing) existing.count += 1
    else map.set(s.doc, { doc: s.doc, title: s.docTitle, count: 1 })
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.title.localeCompare(b.title))
}

export function sectionsOfDoc(doc: string): Section[] {
  const wanted = doc.toLowerCase()
  return sections.filter((s) => s.doc.toLowerCase() === wanted || s.docTitle.toLowerCase() === wanted)
}

export function findSection(id: string): Section | undefined {
  return sectionsById.get(id)
}

function collapse(text: string): string {
  return text.replace(/\s+/g, " ").trim()
}

export function snippet(text: string, query: string, radius = 150): string {
  const needle = query.toLowerCase()
  const at = text.toLowerCase().indexOf(needle)
  if (at < 0) return collapse(text).slice(0, radius * 2)
  const start = Math.max(0, at - radius)
  const end = Math.min(text.length, at + needle.length + radius)
  const prefix = start > 0 ? "…" : ""
  const suffix = end < text.length ? "…" : ""
  return `${prefix}${collapse(text.slice(start, end))}${suffix}`
}

export function searchDocs(query: string, limit: number): Section[] {
  const needle = query.toLowerCase().trim()
  if (needle === "") return []
  const hits: { section: Section; score: number }[] = []
  for (const s of sections) {
    const title = s.title.toLowerCase()
    const body = s.text.toLowerCase()
    const titleHit = title.includes(needle)
    const bodyHit = body.includes(needle)
    if (!titleHit && !bodyHit) continue
    const score = (titleHit ? 100 : 0) + (title === needle ? 50 : 0) + (bodyHit ? 1 : 0)
    hits.push({ section: s, score })
  }
  hits.sort((a, b) => b.score - a.score || a.section.title.length - b.section.title.length)
  return hits.slice(0, limit).map((h) => h.section)
}

export function formatOverview(): string {
  const groups = docGroups()
  const modules = moduleSummaries()
  return [
    `${meta.language} reference — ${String(meta.docs)} doc sections from ${groups.length} documents, ${String(meta.symbols)} public symbols from motoko-base, ${String(meta.samples)} sample programs.`,
    `Repo: ${meta.repo}`,
    `Site: ${meta.site}`,
    `Source commit: ${meta.commit}`,
    `Base modules covered: ${String(modules.length)}`,
    "",
    "Documents:",
    ...groups.map((g) => `- ${g.title} (${g.doc}) — ${String(g.count)} sections`),
  ].join("\n")
}

export function formatDocs(): string {
  const groups = docGroups()
  return [
    `${String(groups.length)} documents in the bundled docs:`,
    ...groups.map((g) => `- ${g.title} — ${String(g.count)} sections — id ${g.doc}`),
  ].join("\n")
}

export function formatSections(list: Section[]): string {
  const map = new Map<string, Section[]>()
  for (const s of list) {
    const arr = map.get(s.docTitle)
    if (arr) arr.push(s)
    else map.set(s.docTitle, [s])
  }
  const out: string[] = []
  for (const [title, secs] of map) {
    out.push(`${title}:`)
    for (const s of secs) out.push(`  ${s.id} — ${s.title}`)
  }
  return out.join("\n")
}

export function formatSection(section: Section): string {
  return [
    `${section.title}`,
    `${section.docTitle} (${section.doc}) — section ${section.id}`,
    "",
    truncate(section.text),
  ].join("\n")
}

export function formatDocSearch(query: string, results: Section[]): string {
  if (results.length === 0) return `No doc section matches "${query}". Try search_docs with a shorter word.`
  const out = [`${String(results.length)} section(s) matching "${query}":`]
  for (const s of results) {
    out.push(`- ${s.title} (${s.docTitle}, id ${s.id})`)
    out.push(`    ${snippet(s.text, query)}`)
  }
  return out.join("\n")
}

/** The compiler repo's own index page, used by `quickstart`. */
export function quickstartSections(): Section[] {
  const byDoc = docGroups()
  const preferred = byDoc.find((d) => d.doc.startsWith("motoko_index"))
  if (preferred) return sectionsOfDoc(preferred.doc)
  const fallback = byDoc.find((d) => d.doc.toLowerCase().includes("index"))
  if (fallback) return sectionsOfDoc(fallback.doc)
  const first = byDoc[0]
  return first ? sectionsOfDoc(first.doc) : []
}

/* --------------------------------------------------------------- symbols */

/** `public func f` → `func`; motoko-base only exposes public declarations. */
export function declKind(symbol: Symbol): string {
  const m = /\b(func|let|type|class|module)\b/.exec(symbol.signature)
  return m ? m[1] : "value"
}

export const symbolByName = new Map<string, Symbol[]>()
for (const s of symbols) {
  const key = s.name.toLowerCase()
  const arr = symbolByName.get(key)
  if (arr) arr.push(s)
  else symbolByName.set(key, [s])
}

export interface ModuleSummary {
  module: string
  count: number
  names: string[]
}

export function moduleSummaries(): ModuleSummary[] {
  const map = new Map<string, Symbol[]>()
  for (const s of symbols) {
    const arr = map.get(s.module)
    if (arr) arr.push(s)
    else map.set(s.module, [s])
  }
  return [...map.entries()]
    .map(([module, list]) => ({ module, count: list.length, names: list.slice(0, 4).map((s) => s.name) }))
    .sort((a, b) => b.count - a.count || a.module.localeCompare(b.module))
}

export function symbolsOfModule(module: string): Symbol[] {
  const wanted = module.toLowerCase()
  return symbols.filter((s) => s.module.toLowerCase() === wanted)
}

export function lookupSymbol(name: string): Symbol[] {
  const needle = name.toLowerCase().replace(/^mo:base\//, "")
  const exact = symbolByName.get(needle) ?? []
  if (exact.length > 0) return exact
  return symbols.filter((s) => s.name.toLowerCase().startsWith(needle)).slice(0, 30)
}

export function searchSymbols(query: string, module: string | undefined, limit: number): Symbol[] {
  const needle = query.toLowerCase().trim()
  if (needle === "") return []
  const scope = module ? new Set(symbolsOfModule(module).map((s) => `${s.module}.${s.name}`)) : undefined
  const pool = scope ? symbols.filter((s) => scope.has(`${s.module}.${s.name}`)) : symbols
  return pool
    .filter((s) => s.name.toLowerCase().includes(needle) || s.signature.toLowerCase().includes(needle))
    .slice(0, limit)
}

export function kinds(): { kind: string; count: number }[] {
  const map = new Map<string, number>()
  for (const s of symbols) {
    const k = declKind(s)
    map.set(k, (map.get(k) ?? 0) + 1)
  }
  return [...map.entries()].map(([kind, count]) => ({ kind, count })).sort((a, b) => b.count - a.count)
}

export function symbolsOfKind(kind: string): Symbol[] {
  const wanted = kind.toLowerCase()
  return symbols.filter((s) => declKind(s) === wanted)
}

function formatSymbolLine(s: Symbol): string {
  return `  [${s.module}] ${s.signature.replace(/\s+/g, " ").trim()}`
}

export function formatSymbolLookup(query: string, results: Symbol[]): string {
  if (results.length === 0) return `No symbol named "${query}" in motoko-base. Try search_symbols for a partial name.`
  const out = [`${String(results.length)} symbol(s) matching "${query}":`]
  for (const s of results) out.push(formatSymbolLine(s))
  out.push("", "Import the module first, e.g. `import Array \"mo:base/Array\"`, then call `Array.<name>`.")
  return out.join("\n")
}

export function formatSymbolSearch(query: string, results: Symbol[]): string {
  if (results.length === 0) return `No symbol matches "${query}". Try a shorter substring, or list_modules.`
  return [`${String(results.length)} symbol(s) matching "${query}":`, ...results.map(formatSymbolLine)].join("\n")
}

export function formatModules(): string {
  const list = moduleSummaries()
  return [
    `${String(list.length)} motoko-base modules, largest first:`,
    ...list.map((m) => `- ${m.module} — ${String(m.count)} symbols`),
  ].join("\n")
}

export function formatModuleSymbols(module: string, list: Symbol[]): string {
  if (list.length === 0) return `No module named "${module}". Try list_modules for the exact name.`
  return [
    `${module} — ${String(list.length)} public symbols:`,
    ...list.map((s) => `  ${declKind(s)} ${s.name}`),
  ].join("\n")
}

export function formatKinds(): string {
  return [
    "Motoko Base symbols by declaration form (everything motoko-base exposes is public):",
    ...kinds().map((k) => `- ${k.kind} — ${String(k.count)}`),
  ].join("\n")
}

export function formatSymbolsByKind(kind: string, list: Symbol[]): string {
  if (list.length === 0) return `No symbols of kind "${kind}". Kinds: ${kinds().map((k) => k.kind).join(", ")}.`
  return [`${String(list.length)} ${kind} symbol(s):`, ...list.map(formatSymbolLine)].join("\n")
}

export function formatBaseModules(): string {
  const list = moduleSummaries()
  return [
    `motoko-base module index — ${String(list.length)} modules:`,
    ...list.map((m) => `- ${m.module} (${String(m.count)}): ${m.names.join(", ")}${m.count > m.names.length ? ", …" : ""}`),
  ].join("\n")
}

/* --------------------------------------------------------------- samples */

export function findSample(name: string): Sample | undefined {
  const wanted = name.toLowerCase()
  const bare = wanted.endsWith(".mo") ? wanted.slice(0, -3) : wanted
  return (
    samples.find((s) => s.name.toLowerCase() === wanted) ??
    samples.find((s) => s.name.toLowerCase() === `${bare}.mo`) ??
    samples.find((s) => s.name.toLowerCase().includes(bare))
  )
}

export function searchSamples(query: string, limit: number): Sample[] {
  const needle = query.toLowerCase().trim()
  if (needle === "") return []
  return samples.filter((s) => s.code.toLowerCase().includes(needle)).slice(0, limit)
}

export function formatSampleList(): string {
  if (samples.length === 0) return "No samples are bundled in this build."
  return [
    `${String(samples.length)} real Motoko sample programs:`,
    ...samples.map((s) => `- ${s.name} — ${s.path} — ${String(s.bytes)} bytes`),
  ].join("\n")
}

export function formatSample(sample: Sample): string {
  return [`${sample.name} (${sample.path}, ${String(sample.bytes)} bytes)`, "", "```motoko", sample.code.trimEnd(), "```"].join("\n")
}

export function formatSampleSearch(query: string, results: Sample[]): string {
  if (results.length === 0) return `No sample code contains "${query}".`
  const out = [`${String(results.length)} sample(s) contain "${query}":`]
  for (const s of results) out.push(`- ${s.name}: ${snippet(s.code, query, 120)}`)
  return out.join("\n")
}

/* ------------------------------------------------------------- search all */

export function formatSearchAll(query: string, limit: number): string {
  const docs = searchDocs(query, limit)
  const syms = searchSymbols(query, undefined, limit)
  const sampleHits = searchSamples(query, limit)
  const out = [`Search results for "${query}" across docs, motoko-base symbols and samples.`]
  out.push("", `## Docs (${String(docs.length)})`)
  out.push(docs.length === 0 ? "  none" : docs.map((d) => `- ${d.title} (${d.docTitle}, id ${d.id})`).join("\n"))
  out.push("", `## Symbols (${String(syms.length)})`)
  out.push(syms.length === 0 ? "  none" : syms.map(formatSymbolLine).join("\n"))
  out.push("", `## Samples (${String(sampleHits.length)})`)
  out.push(sampleHits.length === 0 ? "  none" : sampleHits.map((s) => `- ${s.name} (${s.path})`).join("\n"))
  return out.join("\n")
}
