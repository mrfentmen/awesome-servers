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

export interface BqnSymbol {
  module: string
  kind: string
  name: string
  signature: string
  description: string
}

export interface Sample {
  name: string
  path: string
  bytes: number
  code: string
}

function loadJson<T>(file: string): T {
  const raw = readFileSync(new URL(`../data/${file}`, import.meta.url), "utf8")
  return JSON.parse(raw) as T
}

export const meta: Meta = loadJson<Meta>("meta.json")
export const sections: Section[] = loadJson<Section[]>("docs.json")
export const symbols: BqnSymbol[] = loadJson<BqnSymbol[]>("symbols.json")
export const samples: Sample[] = loadJson<Sample[]>("samples.json")

export const TRUNCATE_AT = 60000
const SNIPPET_RADIUS = 150
const DEFAULT_LIMIT = 5

const sectionsById = new Map<string, Section>(sections.map((s) => [s.id, s]))
const samplesByName = new Map<string, Sample>(samples.map((s) => [s.name.toLowerCase(), s]))

function collapse(text: string): string {
  return text.replace(/\s+/g, " ").trim()
}

export function truncate(text: string): string {
  if (text.length <= TRUNCATE_AT) return text
  return `${text.slice(0, TRUNCATE_AT)}\n\n[truncated at ${TRUNCATE_AT} chars — section is ${text.length} chars]`
}

export function snippet(text: string, query: string): string {
  const flat = collapse(text)
  const at = flat.toLowerCase().indexOf(query.toLowerCase())
  if (at < 0) return flat.slice(0, SNIPPET_RADIUS * 2)
  const start = Math.max(0, at - SNIPPET_RADIUS)
  const end = Math.min(flat.length, at + query.length + SNIPPET_RADIUS)
  return `${start > 0 ? "…" : ""}${flat.slice(start, end)}${end < flat.length ? "…" : ""}`
}

/* ---------------------------------------------------------------- docs */

export interface DocGroup {
  doc: string
  docTitle: string
  sections: number
}

export function docGroups(): DocGroup[] {
  const order: string[] = []
  const seen = new Map<string, DocGroup>()
  for (const s of sections) {
    const existing = seen.get(s.doc)
    if (existing) {
      existing.sections += 1
      continue
    }
    order.push(s.doc)
    const group: DocGroup = { doc: s.doc, docTitle: s.docTitle, sections: 1 }
    seen.set(s.doc, group)
  }
  return order.map((id) => seen.get(id)).filter((g): g is DocGroup => g !== undefined)
}

export function sectionsOfDoc(doc?: string): Section[] {
  if (!doc) return sections
  const wanted = doc.toLowerCase()
  return sections.filter((s) => s.doc.toLowerCase() === wanted)
}

export function findSection(id: string): Section | undefined {
  return sectionsById.get(id)
}

export interface SectionHit {
  section: Section
  snippet: string
}

export function searchSections(query: string, limit: number = DEFAULT_LIMIT): SectionHit[] {
  const q = query.toLowerCase()
  const titleHits: SectionHit[] = []
  const textHits: SectionHit[] = []
  for (const s of sections) {
    if (s.title.toLowerCase().includes(q)) {
      titleHits.push({ section: s, snippet: snippet(s.text, query) })
    } else if (s.text.toLowerCase().includes(q)) {
      textHits.push({ section: s, snippet: snippet(s.text, query) })
    }
    if (titleHits.length + textHits.length >= limit * 4) break
  }
  return [...titleHits, ...textHits].slice(0, limit)
}

/** The closest thing BQN has to a getting-started page. */
export function quickstartSections(): Section[] {
  const preferred = ["bqn_index", "bqn_quick", "bqn_running"]
  for (const id of preferred) {
    const found = sections.filter((s) => s.doc === id)
    if (found.length > 0) return found
  }
  const byName = sections.filter((s) => /quick|running|index|tutorial/i.test(s.doc))
  return byName.length > 0 ? byName.slice(0, 4) : sections.slice(0, 3)
}

/* ------------------------------------------------------------- symbols */

export function lookupSymbol(name: string): BqnSymbol[] {
  const wanted = name.toLowerCase()
  const exact = symbols.filter((s) => s.name.toLowerCase() === wanted)
  if (exact.length > 0) return exact
  return symbols.filter((s) => s.name.toLowerCase().startsWith(wanted)).slice(0, 10)
}

export function searchSymbols(query: string, module?: string, limit: number = 10): BqnSymbol[] {
  const q = query.toLowerCase()
  const mod = module?.toLowerCase()
  return symbols
    .filter((s) => (mod ? s.module.toLowerCase() === mod : true))
    .filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.signature.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q),
    )
    .slice(0, limit)
}

export interface Counted {
  key: string
  count: number
}

function countBy<T>(items: T[], key: (item: T) => string): Counted[] {
  const counts = new Map<string, number>()
  for (const item of items) {
    const k = key(item)
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([k, count]) => ({ key: k, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
}

export function moduleCounts(): Counted[] {
  return countBy(symbols, (s) => s.module)
}

export function kindCounts(): Counted[] {
  return countBy(symbols, (s) => s.kind)
}

export function symbolsInModule(module: string): BqnSymbol[] {
  const wanted = module.toLowerCase()
  return symbols.filter((s) => s.module.toLowerCase() === wanted)
}

export function symbolsByKind(kind: string): BqnSymbol[] {
  const wanted = kind.toLowerCase()
  return symbols.filter((s) => s.kind.toLowerCase() === wanted)
}

/** Every section whose text contains the glyph, plus the first matching line. */
export interface GlyphHit {
  section: Section
  line: string
}

export function glyphLookup(glyph: string, limit: number = 10): GlyphHit[] {
  const hits: GlyphHit[] = []
  for (const s of sections) {
    if (!s.text.includes(glyph)) continue
    const line = s.text
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.includes(glyph))
    hits.push({ section: s, line: line ?? collapse(s.text).slice(0, 200) })
    if (hits.length >= limit) break
  }
  return hits
}

/* -------------------------------------------------------------- samples */

export function findSample(name: string): Sample | undefined {
  const wanted = name.toLowerCase()
  const direct = samplesByName.get(wanted) ?? samplesByName.get(`${wanted}.bqn`)
  if (direct) return direct
  return samples.find((s) => s.name.toLowerCase().includes(wanted))
}

export interface SampleHit {
  sample: Sample
  snippet: string
}

export function searchSamples(query: string, limit: number = DEFAULT_LIMIT): SampleHit[] {
  const q = query.toLowerCase()
  const hits: SampleHit[] = []
  for (const s of samples) {
    if (!s.code.toLowerCase().includes(q)) continue
    const at = s.code.toLowerCase().indexOf(q)
    const start = Math.max(0, at - SNIPPET_RADIUS)
    const end = Math.min(s.code.length, at + query.length + SNIPPET_RADIUS)
    hits.push({ sample: s, snippet: s.code.slice(start, end).trim() })
    if (hits.length >= limit) break
  }
  return hits
}

/* ----------------------------------------------------------- formatting */

export function formatOverview(): string {
  const groups = docGroups()
  return [
    `${meta.language} — reference server`,
    `Upstream: ${meta.repo}`,
    `Docs site: ${meta.site}`,
    `Data generated from commit ${meta.commit}`,
    "",
    `Bundled: ${meta.docs} doc sections across ${groups.length} documents, ` +
      `${meta.symbols} primitives/concepts, ${meta.samples} real test programs.`,
    "",
    "Documents:",
    ...groups.map((g) => `  ${g.doc} — ${g.docTitle} (${g.sections} sections)`),
  ].join("\n")
}

export function formatDocs(): string {
  const groups = docGroups()
  return [
    `${groups.length} documents, ${meta.docs} sections:`,
    ...groups.map((g) => `- ${g.doc} — ${g.docTitle} (${g.sections} sections)`),
  ].join("\n")
}

export function formatSectionList(doc?: string): string {
  const list = sectionsOfDoc(doc)
  if (list.length === 0) {
    return `No document with id "${doc ?? ""}". Use list_docs to see the ids.`
  }
  const head = doc ? `${list.length} sections in ${doc}:` : `${list.length} sections:`
  return [head, ...list.map((s) => `- ${s.id} — ${s.title}`)].join("\n")
}

export function formatSection(section: Section): string {
  return `# ${section.title}\n(${section.docTitle} • ${section.id})\n\n${truncate(section.text)}`
}

export function formatSectionHits(hits: SectionHit[], query: string): string {
  if (hits.length === 0) return `No section mentions "${query}".`
  return [
    `${hits.length} section(s) matching "${query}":`,
    ...hits.map((h) => `\n## ${h.section.title}\n(${h.section.docTitle} • ${h.section.id})\n${h.snippet}`),
  ].join("\n")
}

export function formatQuickstart(): string {
  const list = quickstartSections()
  return [
    "# BQN quick start",
    ...list.map((s) => `\n## ${s.title}\n(${s.docTitle} • ${s.id})\n\n${truncate(s.text)}`),
  ].join("\n")
}

export function formatSymbol(s: BqnSymbol): string {
  return `- ${s.name} — ${s.signature}\n    ${collapse(s.description)}`
}

export function formatSymbolLookup(found: BqnSymbol[], name: string): string {
  if (found.length === 0) return `No primitive or concept named "${name}". Try search_symbols.`
  return [`${found.length} entry(ies) for "${name}":`, ...found.map(formatSymbol)].join("\n")
}

export function formatSymbolList(list: BqnSymbol[], head: string): string {
  if (list.length === 0) return `No symbols for ${head}.`
  return [`${list.length} symbol(s) for ${head}:`, ...list.map(formatSymbol)].join("\n")
}

export function formatCounts(counts: Counted[], label: string): string {
  if (counts.length === 0) return `No ${label} recorded.`
  return [`${counts.length} ${label}:`, ...counts.map((c) => `- ${c.key} (${c.count})`)].join("\n")
}

export function formatGlyphHits(hits: GlyphHit[], glyph: string): string {
  if (hits.length === 0) {
    return `No section contains the glyph "${glyph}". Try search_docs with a word instead.`
  }
  return [
    `${hits.length} section(s) that use "${glyph}":`,
    ...hits.map((h) => `\n## ${h.section.title}\n(${h.section.docTitle} • ${h.section.id})\n${h.line}`),
  ].join("\n")
}

export function formatSamples(): string {
  if (samples.length === 0) return "No sample programs are bundled."
  return [
    `${samples.length} sample program(s) from the BQN test suite:`,
    ...samples.map((s) => `- ${s.name} (${s.path}, ${s.bytes} bytes)`),
  ].join("\n")
}

export function formatSample(s: Sample): string {
  return `# ${s.name}\n${s.path} (${s.bytes} bytes)\n\n\`\`\`bqn\n${s.code}\n\`\`\``
}

export function formatSampleHits(hits: SampleHit[], query: string): string {
  if (hits.length === 0) return `No sample code contains "${query}".`
  return [
    `${hits.length} sample(s) containing "${query}":`,
    ...hits.map((h) => `\n## ${h.sample.name}\n\`\`\`bqn\n${h.snippet}\n\`\`\``),
  ].join("\n")
}

export function formatSearchAll(query: string, docLimit = 3, symbolLimit = 5, sampleLimit = 3): string {
  const docs = searchSections(query, docLimit)
  const syms = searchSymbols(query, undefined, symbolLimit)
  const samp = searchSamples(query, sampleLimit)
  return [
    `# Everything matching "${query}"`,
    `\n## Docs (${docs.length})`,
    formatSectionHits(docs, query),
    `\n## Primitives and concepts (${syms.length})`,
    formatSymbolList(syms, `"${query}"`),
    `\n## Sample programs (${samp.length})`,
    formatSampleHits(samp, query),
  ].join("\n")
}
