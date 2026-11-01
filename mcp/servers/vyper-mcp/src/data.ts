import { readFileSync } from "node:fs"

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

export interface SymbolEntry {
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
  const raw = readFileSync(new URL(`../data/${file}`, import.meta.url), "utf8")
  return JSON.parse(raw) as T
}

export const meta = load<Meta>("meta.json")
export const sections = load<Section[]>("docs.json")
export const symbols = load<SymbolEntry[]>("symbols.json")
export const samples = load<Sample[]>("samples.json")

export const TRUNCATE_AT = 60000

const sectionById = new Map<string, Section>()
for (const s of sections) sectionById.set(s.id, s)

const symbolsByName = new Map<string, SymbolEntry[]>()
for (const s of symbols) {
  const key = s.name.toLowerCase()
  const list = symbolsByName.get(key)
  if (list) list.push(s)
  else symbolsByName.set(key, [s])
}

export interface DocGroup {
  doc: string
  docTitle: string
  count: number
}

export function docGroups(): DocGroup[] {
  const map = new Map<string, DocGroup>()
  for (const s of sections) {
    const existing = map.get(s.doc)
    if (existing) existing.count += 1
    else map.set(s.doc, { doc: s.doc, docTitle: s.docTitle, count: 1 })
  }
  return [...map.values()].sort((a, b) => a.docTitle.localeCompare(b.docTitle))
}

export function sectionsOfDoc(doc?: string): Section[] {
  if (!doc) return sections
  const key = doc.toLowerCase()
  return sections.filter((s) => s.doc.toLowerCase() === key || s.doc.toLowerCase().includes(key))
}

export function findSection(id: string): Section | undefined {
  return sectionById.get(id)
}

export function truncate(text: string): string {
  if (text.length <= TRUNCATE_AT) return text
  return `${text.slice(0, TRUNCATE_AT)}\n\n[truncated at ${TRUNCATE_AT} chars — section is ${text.length} chars]`
}

export function snippet(text: string, query: string, radius = 160): string {
  const flat = text.replace(/\s+/g, " ").trim()
  const at = flat.toLowerCase().indexOf(query.toLowerCase())
  if (at < 0) return flat.slice(0, radius * 2)
  const start = Math.max(0, at - radius)
  const end = Math.min(flat.length, at + query.length + radius)
  const prefix = start > 0 ? "…" : ""
  const suffix = end < flat.length ? "…" : ""
  return `${prefix}${flat.slice(start, end)}${suffix}`
}

export interface SectionHit {
  section: Section
  where: "title" | "text"
  excerpt: string
}

export function searchSections(query: string, limit: number): SectionHit[] {
  const q = query.toLowerCase()
  const hits: SectionHit[] = []
  for (const s of sections) {
    if (s.title.toLowerCase().includes(q)) {
      hits.push({ section: s, where: "title", excerpt: snippet(s.text, query) })
    } else if (s.text.toLowerCase().includes(q)) {
      hits.push({ section: s, where: "text", excerpt: snippet(s.text, query) })
    }
  }
  hits.sort((a, b) => (a.where === b.where ? 0 : a.where === "title" ? -1 : 1))
  return hits.slice(0, limit)
}

export function lookupSymbols(name: string, limit = 20): SymbolEntry[] {
  const key = name.toLowerCase()
  const exact = symbolsByName.get(key) ?? []
  if (exact.length > 0) return exact.slice(0, limit)
  const prefixed = symbols.filter((s) => s.name.toLowerCase().startsWith(key))
  return prefixed.slice(0, limit)
}

export function searchSymbols(query: string, module?: string, limit = 10): SymbolEntry[] {
  const q = query.toLowerCase()
  const moduleKey = module?.toLowerCase()
  return symbols
    .filter((s) => (moduleKey ? s.module.toLowerCase() === moduleKey : true))
    .filter((s) => s.name.toLowerCase().includes(q) || s.signature.toLowerCase().includes(q))
    .slice(0, limit)
}

export interface ModuleSummary {
  module: string
  count: number
  kinds: string[]
}

export function moduleSummaries(): ModuleSummary[] {
  const map = new Map<string, ModuleSummary>()
  for (const s of symbols) {
    const existing = map.get(s.module)
    if (existing) {
      existing.count += 1
      if (!existing.kinds.includes(s.kind)) existing.kinds.push(s.kind)
    } else {
      map.set(s.module, { module: s.module, count: 1, kinds: [s.kind] })
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count)
}

export interface KindSummary {
  kind: string
  count: number
}

export function kindSummaries(): KindSummary[] {
  const map = new Map<string, number>()
  for (const s of symbols) map.set(s.kind, (map.get(s.kind) ?? 0) + 1)
  return [...map.entries()]
    .map(([kind, count]) => ({ kind, count }))
    .sort((a, b) => b.count - a.count)
}

export function symbolsInModule(module: string): SymbolEntry[] {
  const key = module.toLowerCase()
  return symbols.filter((s) => s.module.toLowerCase() === key)
}

export function symbolsByKind(kind: string): SymbolEntry[] {
  const key = kind.toLowerCase()
  return symbols.filter((s) => s.kind.toLowerCase() === key)
}

export function findSample(name: string): Sample | undefined {
  const key = name.toLowerCase().replace(/\.vy$/, "")
  return samples.find((s) => s.name.toLowerCase().replace(/\.vy$/, "") === key)
    ?? samples.find((s) => s.name.toLowerCase().includes(key))
}

export function searchSamples(query: string, limit = 5): { sample: Sample; excerpt: string }[] {
  const q = query.toLowerCase()
  const out: { sample: Sample; excerpt: string }[] = []
  for (const s of samples) {
    if (s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)) {
      out.push({ sample: s, excerpt: snippet(s.code, query) })
    }
    if (out.length >= limit) break
  }
  return out
}

export function builtinFunctions(): SymbolEntry[] {
  return symbols.filter((s) => s.module.toLowerCase().includes("built-in-functions"))
}

/* ------------------------------------------------------------------ formatters */

export function formatOverview(): string {
  const docs = docGroups()
  return [
    `${meta.language} reference (offline)`,
    `Upstream: ${meta.repo}`,
    `Docs site: ${meta.site}`,
    `Source commit: ${meta.commit}`,
    "",
    `Bundled: ${meta.docs} doc sections across ${docs.length} pages, ${meta.symbols} symbols, ${meta.samples} example contract(s).`,
    "",
    "Pages:",
    ...docs.map((d) => `  ${d.docTitle} (${d.doc}) — ${d.count} sections`),
  ].join("\n")
}

export function formatDocs(): string {
  return [
    `${meta.docs} sections across ${docGroups().length} pages:`,
    ...docGroups().map((d) => `- ${d.docTitle} — ${d.count} sections — id \`${d.doc}\``),
  ].join("\n")
}

export function formatSectionsList(doc?: string): string {
  const list = sectionsOfDoc(doc)
  if (list.length === 0) return `No document matched "${doc ?? ""}". Use list_docs to see the page ids.`
  return [
    `${list.length} section(s)${doc ? ` in ${doc}` : ""}:`,
    ...list.map((s) => `- ${s.title} — \`${s.id}\` (${s.docTitle})`),
  ].join("\n")
}

export function formatSection(section: Section): string {
  return [
    `# ${section.title}`,
    `${section.docTitle} · ${section.id}`,
    "",
    truncate(section.text),
  ].join("\n")
}

export function formatSectionHits(hits: SectionHit[]): string {
  if (hits.length === 0) return "No section matched. Try a shorter query or search_symbols."
  return hits
    .map((h) => `- ${h.section.title} (${h.section.docTitle}, \`${h.section.id}\`)\n  ${h.excerpt}`)
    .join("\n\n")
}

export function formatSymbols(items: SymbolEntry[], heading: string): string {
  if (items.length === 0) return `${heading}: nothing found. Try search_symbols with a shorter query.`
  return [`${heading}:`, ...items.map((s) => `- ${s.signature}  [${s.kind} · ${s.module}]`)].join("\n")
}

export function formatModules(): string {
  return [
    `${symbols.length} symbols across ${moduleSummaries().length} pages:`,
    ...moduleSummaries().map((m) => `- ${m.module} — ${m.count} symbols (${m.kinds.join(", ")})`),
  ].join("\n")
}

export function formatKinds(): string {
  return kindSummaries().map((k) => `- ${k.kind}: ${k.count}`).join("\n")
}

export function formatSampleList(): string {
  if (samples.length === 0) return "No example contracts are bundled."
  return [
    `${samples.length} example contract(s):`,
    ...samples.map((s) => `- ${s.name} — ${s.bytes} bytes — \`${s.path}\``),
  ].join("\n")
}

export function formatSample(sample: Sample): string {
  return [`# ${sample.name}`, `Path: ${sample.path}`, "", "```vyper", sample.code.trimEnd(), "```"].join("\n")
}

export function formatSampleHits(hits: { sample: Sample; excerpt: string }[]): string {
  if (hits.length === 0) return "No example contract contained that text."
  return hits.map((h) => `- ${h.sample.name} (${h.sample.path})\n  ${h.excerpt}`).join("\n\n")
}

export function formatSearchAll(query: string, limit: number): string {
  const docHits = searchSections(query, limit)
  const symbolHits = searchSymbols(query, undefined, limit)
  const sampleHits = searchSamples(query, limit)
  return [
    `Search: "${query}"`,
    "",
    `## Docs (${docHits.length})`,
    formatSectionHits(docHits),
    "",
    `## Symbols (${symbolHits.length})`,
    formatSymbols(symbolHits, "matches"),
    "",
    `## Examples (${sampleHits.length})`,
    formatSampleHits(sampleHits),
  ].join("\n")
}

export function formatBuiltins(): string {
  const items = builtinFunctions()
  if (items.length === 0) return "No builtin functions were extracted from the docs."
  const byKind = new Map<string, SymbolEntry[]>()
  for (const s of items) {
    const list = byKind.get(s.kind)
    if (list) list.push(s)
    else byKind.set(s.kind, [s])
  }
  const blocks: string[] = [`${items.length} built-in symbols:`]
  for (const [kind, list] of byKind) {
    blocks.push("", `### ${kind} (${list.length})`)
    for (const s of list) blocks.push(`- ${s.signature}`)
  }
  return blocks.join("\n")
}
