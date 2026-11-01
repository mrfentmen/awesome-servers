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

export interface MoveSymbol {
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

export interface DocGroup {
  doc: string
  title: string
  count: number
}

export interface CategoryCount {
  name: string
  count: number
}

export const TRUNCATE_AT = 60000

function load<T>(file: string): T {
  const raw = readFileSync(new URL(`../data/${file}`, import.meta.url), "utf8")
  return JSON.parse(raw) as T
}

export const meta = load<Meta>("meta.json")
export const sections = load<Section[]>("docs.json")
export const symbols = load<MoveSymbol[]>("symbols.json")
export const samples = load<Sample[]>("samples.json")

/* ---------------------------------------------------------------- indexes */

const sectionById = new Map<string, Section>(sections.map((s) => [s.id, s]))

const symbolsByName = new Map<string, MoveSymbol[]>()
const symbolsByModule = new Map<string, MoveSymbol[]>()
const symbolsByKind = new Map<string, MoveSymbol[]>()

for (const s of symbols) {
  const byName = symbolsByName.get(s.name)
  if (byName) byName.push(s)
  else symbolsByName.set(s.name, [s])

  const byModule = symbolsByModule.get(s.module)
  if (byModule) byModule.push(s)
  else symbolsByModule.set(s.module, [s])

  const byKind = symbolsByKind.get(s.kind)
  if (byKind) byKind.push(s)
  else symbolsByKind.set(s.kind, [s])
}

/* --------------------------------------------------------------- helpers */

export function truncate(text: string, limit: number = TRUNCATE_AT): string {
  if (text.length <= limit) return text
  return `${text.slice(0, limit)}\n\n[truncated at ${limit} chars — section is ${text.length} chars]`
}

function clean(s: string): string {
  return s.replace(/\s+/g, " ").trim()
}

export function snippet(text: string, query: string, radius = 150): string {
  const flat = clean(text)
  const at = flat.toLowerCase().indexOf(query.toLowerCase())
  if (at < 0) return flat.slice(0, radius * 2) + (flat.length > radius * 2 ? "…" : "")
  const start = Math.max(0, at - radius)
  const end = Math.min(flat.length, at + query.length + radius)
  return `${start > 0 ? "…" : ""}${flat.slice(start, end)}${end < flat.length ? "…" : ""}`
}

export function docGroups(): DocGroup[] {
  const order: string[] = []
  const title = new Map<string, string>()
  const count = new Map<string, number>()
  for (const s of sections) {
    if (!title.has(s.doc)) {
      order.push(s.doc)
      title.set(s.doc, s.docTitle)
      count.set(s.doc, 0)
    }
    count.set(s.doc, (count.get(s.doc) ?? 0) + 1)
  }
  return order.map((doc) => ({ doc, title: title.get(doc) ?? doc, count: count.get(doc) ?? 0 }))
}

export function sectionsOfDoc(doc: string): Section[] {
  return sections.filter((s) => s.doc === doc)
}

export function sectionByIdOrNull(id: string): Section | null {
  return sectionById.get(id) ?? null
}

export function searchSections(query: string, limit: number): Section[] {
  const q = query.toLowerCase()
  const titleHits: Section[] = []
  const textHits: Section[] = []
  for (const s of sections) {
    if (s.title.toLowerCase().includes(q)) titleHits.push(s)
    else if (s.text.toLowerCase().includes(q)) textHits.push(s)
  }
  return [...titleHits, ...textHits].slice(0, limit)
}

export function lookupSymbols(name: string): MoveSymbol[] {
  const exact = symbolsByName.get(name)
  if (exact && exact.length > 0) return exact
  const lower = name.toLowerCase()
  return symbols.filter((s) => s.name.toLowerCase().startsWith(lower))
}

export function searchSymbols(query: string, module: string | undefined, limit: number): MoveSymbol[] {
  const q = query.toLowerCase()
  const pool = module ? symbols.filter((s) => s.module.toLowerCase() === module.toLowerCase()) : symbols
  const nameHits: MoveSymbol[] = []
  const sigHits: MoveSymbol[] = []
  for (const s of pool) {
    if (s.name.toLowerCase().includes(q)) nameHits.push(s)
    else if (s.signature.toLowerCase().includes(q)) sigHits.push(s)
  }
  return [...nameHits, ...sigHits].slice(0, limit)
}

export function moduleList(): CategoryCount[] {
  return [...symbolsByModule.entries()]
    .map(([name, list]) => ({ name, count: list.length }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

export function kindList(): CategoryCount[] {
  return [...symbolsByKind.entries()]
    .map(([name, list]) => ({ name, count: list.length }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

export function symbolsInModule(module: string): MoveSymbol[] {
  const exact = symbolsByModule.get(module)
  if (exact) return exact
  const lower = module.toLowerCase()
  for (const [name, list] of symbolsByModule) {
    if (name.toLowerCase() === lower) return list
  }
  return []
}

export function symbolsOfKind(kind: string): MoveSymbol[] {
  const exact = symbolsByKind.get(kind)
  if (exact) return exact
  const lower = kind.toLowerCase()
  for (const [name, list] of symbolsByKind) {
    if (name.toLowerCase() === lower) return list
  }
  return []
}

export function findSample(name: string): Sample | null {
  const wanted = name.toLowerCase().replace(/\.move$/, "")
  const exact = samples.find((s) => s.name.toLowerCase().replace(/\.move$/, "") === wanted)
  if (exact) return exact
  return samples.find((s) => s.name.toLowerCase().includes(wanted)) ?? null
}

export function searchSamples(query: string, limit: number): Sample[] {
  const q = query.toLowerCase()
  return samples.filter((s) => s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)).slice(0, limit)
}

export function quickstartSections(): Section[] {
  const preferred =
    sectionsOfDoc("move_introduction").length > 0
      ? sectionsOfDoc("move_introduction")
      : sectionsOfDoc("move_modules-and-scripts")
  if (preferred.length > 0) return preferred
  const intro = sections.find((s) => s.title.toLowerCase().includes("introduction"))
  return intro ? [intro] : sections.slice(0, 3)
}

/* ------------------------------------------------------------- formatting */

function heading(title: string, sub?: string): string {
  return sub ? `## ${title}\n_${sub}_` : `## ${title}`
}

export function formatOverview(): string {
  const groups = docGroups()
  const kinds = kindList()
  const lines = [
    `# ${meta.language} reference`,
    "",
    `- Upstream: ${meta.repo}`,
    `- Docs site: ${meta.site}`,
    `- Generated from commit: \`${meta.commit}\``,
    `- ${meta.docs} documentation sections across ${groups.length} book pages`,
    `- ${meta.symbols} declarations (${kinds.map((k) => `${k.count} ${k.name}`).join(", ")})`,
    `- ${meta.samples} real Move source files`,
    "",
    "Book pages:",
    ...groups.map((g) => `  ${g.doc.padEnd(38)} ${g.title} (${g.count} sections)`),
    "",
    "Use `quickstart` for the language introduction, `search_docs` or `search_all` for a topic, and `list_abilities` for `copy` / `drop` / `store` / `key`.",
  ]
  return lines.join("\n")
}

export function formatDocs(): string {
  const groups = docGroups()
  return [
    heading("Book pages", `${groups.length} pages, ${meta.docs} sections`),
    ...groups.map((g) => `- \`${g.doc}\` — ${g.title} (${g.count} sections)`),
  ].join("\n")
}

export function formatSections(doc?: string): string {
  if (!doc) {
    return [
      heading("All sections", `${sections.length} total — pass a doc id to narrow`),
      ...docGroups().map((g) => `### ${g.title} (\`${g.doc}\`)\n${sectionsOfDoc(g.doc).map((s) => `  ${s.id} — ${s.title}`).join("\n")}`),
    ].join("\n\n")
  }
  const list = sectionsOfDoc(doc)
  if (list.length === 0) return `No book page with id "${doc}". Use list_docs to see the ids.`
  return [heading(`Sections in ${doc}`, `${list.length} sections`), ...list.map((s) => `- ${s.id} — ${s.title}`)].join("\n")
}

export function formatSection(id: string): string {
  const s = sectionByIdOrNull(id)
  if (!s) return `No section with id "${id}". Use list_sections to find one.`
  return [`# ${s.title}`, `_${s.docTitle} · ${s.doc}_`, "", truncate(s.text)].join("\n")
}

export function formatDocSearch(query: string, limit: number): string {
  const hits = searchSections(query, limit)
  if (hits.length === 0) return `No documentation section mentions "${query}".`
  return [
    heading(`Documentation matches for "${query}"`, `${hits.length} section(s)`),
    ...hits.map((s) => `### ${s.title}\n_${s.docTitle} · \`${s.id}\`_\n\n${snippet(s.text, query)}`),
  ].join("\n\n")
}

export function formatQuickstart(): string {
  const list = quickstartSections()
  return [
    heading("Quickstart", "from the Move book"),
    ...list.map((s) => `### ${s.title}\n\n${truncate(s.text, 12000)}`),
  ].join("\n\n")
}

function formatSymbolLine(s: MoveSymbol): string {
  return `- \`${s.signature}\` — ${s.module} (${s.kind})`
}

export function formatSymbolLookup(name: string): string {
  const hits = lookupSymbols(name)
  if (hits.length === 0) return `No declaration named "${name}" in the book. Try search_symbols.`
  return [heading(`Declarations named "${name}"`, `${hits.length} hit(s)`), ...hits.map(formatSymbolLine)].join("\n")
}

export function formatSymbolSearch(query: string, module: string | undefined, limit: number): string {
  const hits = searchSymbols(query, module, limit)
  const where = module ? ` in ${module}` : ""
  if (hits.length === 0) return `No declaration matching "${query}"${where}.`
  return [heading(`Declarations matching "${query}"${where}`, `${hits.length} hit(s)`), ...hits.map(formatSymbolLine)].join("\n")
}

export function formatModules(): string {
  const list = moduleList()
  return [
    heading("Book pages by declaration count", `${list.length} pages`),
    ...list.map((m) => `- \`${m.name}\` — ${m.count} declarations`),
  ].join("\n")
}

export function formatModule(module: string): string {
  const list = symbolsInModule(module)
  if (list.length === 0) return `No declarations in "${module}". Use list_modules for the ids.`
  return [heading(`Declarations in ${module}`, `${list.length} declaration(s)`), ...list.map(formatSymbolLine)].join("\n")
}

export function formatKinds(): string {
  const list = kindList()
  return [
    heading("Declaration kinds", `${symbols.length} declarations`),
    ...list.map((k) => `- \`${k.name}\` — ${k.count}`),
    "",
    "Pass one of these to list_symbols_by_kind.",
  ].join("\n")
}

export function formatKind(kind: string): string {
  const list = symbolsOfKind(kind)
  if (list.length === 0) return `No declarations of kind "${kind}". Use list_symbol_kinds to see the kinds.`
  return [heading(`Declarations of kind ${kind}`, `${list.length} declaration(s)`), ...list.map(formatSymbolLine)].join("\n")
}

export function formatSampleList(): string {
  return [
    heading("Move sources", `${samples.length} real files from the Move standard library`),
    ...samples.map((s) => `- \`${s.name}\` — ${s.path} (${s.bytes} bytes)`),
    "",
    "Use get_sample with the file name to read one.",
  ].join("\n")
}

export function formatSample(name: string): string {
  const s = findSample(name)
  if (!s) return `No sample named "${name}". Use list_samples.`
  return [`# ${s.name}`, `_${s.path} · ${s.bytes} bytes_`, "", "```move", s.code.trimEnd(), "```"].join("\n")
}

export function formatSampleSearch(query: string, limit: number): string {
  const hits = searchSamples(query, limit)
  if (hits.length === 0) return `No sample code contains "${query}".`
  return [
    heading(`Sample code matching "${query}"`, `${hits.length} file(s)`),
    ...hits.map((s) => `### ${s.name}\n_${s.path}_\n\n\`\`\`move\n${snippet(s.code, query, 200)}\n\`\`\``),
  ].join("\n\n")
}

export function formatSearchAll(query: string, limit: number): string {
  const docHits = searchSections(query, limit)
  const symbolHits = searchSymbols(query, undefined, limit)
  const sampleHits = searchSamples(query, limit)
  const total = docHits.length + symbolHits.length + sampleHits.length
  if (total === 0) return `Nothing in the docs, declarations or samples mentions "${query}".`

  const parts = [heading(`Everything matching "${query}"`, `${total} hit(s) across docs, declarations and samples`)]

  parts.push(`### Documentation (${docHits.length})`)
  parts.push(docHits.length === 0 ? "_none_" : docHits.map((s) => `- ${s.title} — \`${s.id}\`\n  ${snippet(s.text, query, 100)}`).join("\n"))

  parts.push(`### Declarations (${symbolHits.length})`)
  parts.push(symbolHits.length === 0 ? "_none_" : symbolHits.map(formatSymbolLine).join("\n"))

  parts.push(`### Samples (${sampleHits.length})`)
  parts.push(sampleHits.length === 0 ? "_none_" : sampleHits.map((s) => `- \`${s.name}\` — ${s.path}`).join("\n"))

  return parts.join("\n\n")
}

export function formatAbilities(): string {
  const abilities = ["copy", "drop", "store", "key"]
  const parts = [heading("Move abilities", "where the book defines each ability")]
  for (const ability of abilities) {
    const hits = sections
      .filter((s) => new RegExp(`\\b${ability}\\b`, "i").test(s.text) || new RegExp(`\\b${ability}\\b`, "i").test(s.title))
      .slice(0, 3)
    parts.push(`### \`${ability}\` (${hits.length} section(s))`)
    if (hits.length === 0) {
      parts.push("_The book does not discuss this ability._")
      continue
    }
    parts.push(
      hits
        .map((s) => `- ${s.title} — \`${s.id}\`\n  ${snippet(s.text, ability, 120)}`)
        .join("\n"),
    )
  }
  parts.push("_`copy` lets a value be duplicated, `drop` lets it be discarded, `store` lets it live in global storage, `key` makes it a top-level storage entry._")
  return parts.join("\n\n")
}
