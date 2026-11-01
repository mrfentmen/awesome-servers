import { readFileSync } from "node:fs"

/* ------------------------------------------------------------------ types */

export interface Meta {
  language: string
  repo: string
  site: string
  commit: string
  docs: number
  builtins: number
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

export interface Builtin {
  name: string
  signature: string
  returns: string | null
  description: string
  category: string
}

export interface Keyword {
  word: string
  kind: string
}

export interface Sample {
  name: string
  path: string
  bytes: number
  code: string
}

/* ------------------------------------------------------------- data loading
 * The JSON files live next to dist/ in the published package (package.json
 * ships "dist" and "data"), so ../data resolves from dist/data.js. They are
 * parsed once at module load and never fetched at runtime.
 */

function loadJson<T>(file: string): T {
  const raw = readFileSync(new URL(`../data/${file}`, import.meta.url), "utf8")
  return JSON.parse(raw) as T
}

export const meta = loadJson<Meta>("meta.json")
export const docs = loadJson<Section[]>("docs.json")
export const builtins = loadJson<Builtin[]>("builtins.json")
export const keywords = loadJson<Keyword[]>("keywords.json")
export const samples = loadJson<Sample[]>("samples.json")

/* ----------------------------------------------------------------- indexes */

export const sectionsById = new Map<string, Section>(
  docs.map((s) => [s.id, s])
)

export interface DocGroup {
  doc: string
  docTitle: string
  count: number
}

export function docGroups(): DocGroup[] {
  const order: string[] = []
  const counts = new Map<string, number>()
  const titles = new Map<string, string>()
  for (const s of docs) {
    if (!counts.has(s.doc)) {
      order.push(s.doc)
      titles.set(s.doc, s.docTitle)
    }
    counts.set(s.doc, (counts.get(s.doc) ?? 0) + 1)
  }
  return order.map((doc) => ({
    doc,
    docTitle: titles.get(doc) ?? doc,
    count: counts.get(doc) ?? 0,
  }))
}

export function sectionsOf(doc?: string): Section[] {
  if (!doc) return docs
  const wanted = doc.toLowerCase()
  return docs.filter(
    (s) => s.doc.toLowerCase() === wanted || s.docTitle.toLowerCase() === wanted
  )
}

const builtinsByName = new Map<string, Builtin[]>()
for (const b of builtins) {
  const key = b.name.toLowerCase()
  const list = builtinsByName.get(key)
  if (list) list.push(b)
  else builtinsByName.set(key, [b])
}

export interface CategoryCount {
  category: string
  count: number
}

export function categoryCounts(): CategoryCount[] {
  const counts = new Map<string, number>()
  for (const b of builtins) counts.set(b.category, (counts.get(b.category) ?? 0) + 1)
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category))
}

export function builtinsInCategory(category: string): Builtin[] {
  const wanted = category.toLowerCase()
  return builtins.filter((b) => b.category.toLowerCase() === wanted)
}

/* ------------------------------------------------------------------ search */

const TRUNCATE_AT = 60000

export function clip(text: string): string {
  if (text.length <= TRUNCATE_AT) return text
  return `${text.slice(0, TRUNCATE_AT)}\n\n[truncated at ${TRUNCATE_AT} chars — section is ${text.length} chars]`
}

function windowAround(haystack: string, needle: string, radius: number): string {
  const at = haystack.toLowerCase().indexOf(needle.toLowerCase())
  if (at < 0) return haystack.slice(0, radius * 2).replace(/\s+/g, " ").trim()
  const start = Math.max(0, at - radius)
  const end = Math.min(haystack.length, at + needle.length + radius)
  const prefix = start > 0 ? "…" : ""
  const suffix = end < haystack.length ? "…" : ""
  return `${prefix}${haystack.slice(start, end).replace(/\s+/g, " ").trim()}${suffix}`
}

export interface DocHit {
  section: Section
  inTitle: boolean
  snippet: string
}

export function searchDocs(query: string, limit: number): DocHit[] {
  const needle = query.trim()
  if (needle === "") return []
  const lower = needle.toLowerCase()
  const hits: DocHit[] = []
  for (const s of docs) {
    const inTitle = s.title.toLowerCase().includes(lower)
    const inText = s.text.toLowerCase().includes(lower)
    if (!inTitle && !inText) continue
    hits.push({
      section: s,
      inTitle,
      snippet: windowAround(s.text, needle, 180),
    })
  }
  hits.sort((a, b) => {
    if (a.inTitle !== b.inTitle) return a.inTitle ? -1 : 1
    return a.section.title.localeCompare(b.section.title)
  })
  return hits.slice(0, limit)
}

export interface BuiltinHit {
  builtin: Builtin
  inName: boolean
}

export function searchBuiltins(
  query: string,
  category: string | undefined,
  limit: number
): BuiltinHit[] {
  const lower = query.trim().toLowerCase()
  if (lower === "") return []
  const pool = category ? builtinsInCategory(category) : builtins
  const hits: BuiltinHit[] = []
  for (const b of pool) {
    const inName = b.name.toLowerCase().includes(lower)
    const inDesc = b.description.toLowerCase().includes(lower)
    if (!inName && !inDesc) continue
    hits.push({ builtin: b, inName })
  }
  hits.sort((a, b) => {
    if (a.inName !== b.inName) return a.inName ? -1 : 1
    return a.builtin.name.localeCompare(b.builtin.name)
  })
  return hits.slice(0, limit)
}

export interface BuiltinLookup {
  exact: Builtin[]
  prefixed: Builtin[]
}

export function lookupBuiltin(name: string): BuiltinLookup {
  const lower = name.trim().toLowerCase()
  const exact = builtinsByName.get(lower) ?? []
  if (exact.length > 0) return { exact, prefixed: [] }
  const prefixed = builtins.filter((b) => b.name.toLowerCase().startsWith(lower))
  return { exact, prefixed }
}

export function keywordsByKind(kind?: string): Map<string, Keyword[]> {
  const wanted = kind ? kind.toLowerCase() : null
  const grouped = new Map<string, Keyword[]>()
  for (const k of keywords) {
    if (wanted && k.kind.toLowerCase() !== wanted) continue
    const list = grouped.get(k.kind)
    if (list) list.push(k)
    else grouped.set(k.kind, [k])
  }
  return grouped
}

/* ----------------------------------------------------------------- samples */

export function findSample(name: string): Sample | null {
  const lower = name.trim().toLowerCase().replace(/\.lobster$/, "")
  for (const s of samples) {
    const bare = s.name.toLowerCase().replace(/\.lobster$/, "")
    if (bare === lower) return s
  }
  for (const s of samples) {
    if (s.name.toLowerCase().includes(lower)) return s
  }
  return null
}

export interface SampleHit {
  sample: Sample
  snippet: string
}

export function searchSamples(query: string, limit: number): SampleHit[] {
  const needle = query.trim()
  if (needle === "") return []
  const hits: SampleHit[] = []
  for (const s of samples) {
    if (!s.code.toLowerCase().includes(needle.toLowerCase())) continue
    hits.push({ sample: s, snippet: windowAround(s.code, needle, 120) })
  }
  return hits.slice(0, limit)
}

/* -------------------------------------------------------------- formatters */

export function formatOverview(): string {
  const groups = docGroups()
    .map((g) => `- ${g.docTitle} (${g.doc}) — ${g.count} sections`)
    .join("\n")
  return [
    `${meta.language} language reference`,
    `Site: ${meta.site}`,
    `Source: ${meta.repo} @ ${meta.commit.slice(0, 10)}`,
    "",
    `Docs: ${meta.docs} sections across ${groups.split("\n").length} documents`,
    `Builtin functions: ${meta.builtins}`,
    `Keywords: ${meta.keywords}`,
    `Sample programs: ${meta.samples}`,
    "",
    "Documents:",
    groups,
    "",
    "Extracted from the official documentation, builtin reference, keywords list and samples.",
  ].join("\n")
}

export function formatDocs(): string {
  const groups = docGroups()
  return [
    `${groups.length} documents, ${docs.length} sections:`,
    ...groups.map((g) => `- ${g.docTitle} — ${g.count} sections (doc: ${g.doc})`),
  ].join("\n")
}

export function formatSections(doc?: string): string {
  const list = sectionsOf(doc)
  if (list.length === 0) {
    return `No document matched "${doc ?? ""}". Use list_docs to see the available documents.`
  }
  const header = doc ? `${list.length} sections in ${doc}:` : `${list.length} sections:`
  return [header, ...list.map((s) => `- ${s.id} — ${s.title} [${s.docTitle}]`)].join("\n")
}

export function formatSection(id: string): string {
  const section = sectionsById.get(id)
  if (!section) {
    return `No section with id "${id}". Use list_sections or search_docs to find one.`
  }
  return [
    `# ${section.title}`,
    `(${section.docTitle} · ${section.id})`,
    "",
    clip(section.text),
  ].join("\n")
}

export function formatDocSearch(query: string, limit: number): string {
  const hits = searchDocs(query, limit)
  if (hits.length === 0) {
    return `No documentation matched "${query}". Try a shorter or more general term.`
  }
  const body = hits.map((h) => {
    const tag = h.inTitle ? "title match" : "text match"
    return [
      `## ${h.section.title} — ${h.section.docTitle}`,
      `id: ${h.section.id} (${tag})`,
      h.snippet,
    ].join("\n")
  })
  return [`${hits.length} result(s) for "${query}":`, "", ...body].join("\n")
}

function formatBuiltinLine(b: Builtin): string {
  const desc = b.description ? `\n    ${b.description}` : ""
  return `- \`${b.signature}\` [${b.category}]${desc}`
}

export function formatBuiltinLookup(name: string): string {
  const found = lookupBuiltin(name)
  if (found.exact.length > 0) {
    return [
      `${found.exact.length} builtin(s) named "${found.exact[0].name}":`,
      ...found.exact.map(formatBuiltinLine),
    ].join("\n")
  }
  if (found.prefixed.length > 0) {
    return [
      `No builtin is called exactly "${name}". ${found.prefixed.length} name(s) start with it:`,
      ...found.prefixed.slice(0, 25).map(formatBuiltinLine),
    ].join("\n")
  }
  return `No builtin named "${name}". Try search_builtins with a keyword like "string" or "vector".`
}

export function formatBuiltinSearch(
  query: string,
  category: string | undefined,
  limit: number
): string {
  const hits = searchBuiltins(query, category, limit)
  if (hits.length === 0) {
    const scope = category ? ` in category "${category}"` : ""
    return `No builtin matched "${query}"${scope}. Use list_builtin_categories to see the categories.`
  }
  const scope = category ? ` in ${category}` : ""
  return [
    `${hits.length} builtin(s) matching "${query}"${scope}:`,
    ...hits.map((h) => formatBuiltinLine(h.builtin)),
  ].join("\n")
}

export function formatCategories(): string {
  const cats = categoryCounts()
  return [
    `${cats.length} builtin categories, ${builtins.length} functions total:`,
    ...cats.map((c) => `- ${c.category} — ${c.count}`),
  ].join("\n")
}

export function formatCategory(category: string): string {
  const list = builtinsInCategory(category)
  if (list.length === 0) {
    return `No builtin category "${category}". Use list_builtin_categories to see the ${categoryCounts().length} categories.`
  }
  return [
    `${list.length} builtin(s) in ${list[0].category}:`,
    ...list.map(formatBuiltinLine),
  ].join("\n")
}

export function formatKeywords(kind?: string): string {
  const grouped = keywordsByKind(kind)
  if (grouped.size === 0) {
    const kinds = [...new Set(keywords.map((k) => k.kind))].join(", ")
    return `No keywords of kind "${kind ?? ""}". Known kinds: ${kinds}.`
  }
  const blocks: string[] = []
  for (const [k, words] of [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    blocks.push(`${k} (${words.length}): ${words.map((w) => w.word).join(", ")}`)
  }
  return [`${keywords.length} keywords from the language reference:`, "", ...blocks].join("\n")
}

export function formatCheatsheet(): string {
  const sections = docs.filter((s) => s.doc === "cheat_sheet")
  if (sections.length === 0) return "The cheat sheet document is missing from this build."
  return [
    "# C-style language cheat sheet for Lobster",
    "",
    clip(sections.map((s) => s.text).join("\n\n")),
  ].join("\n")
}

export function formatSampleList(): string {
  return [
    `${samples.length} sample programs (use get_sample with a name to read the code):`,
    ...samples.map((s) => `- ${s.name} — ${(s.bytes / 1024).toFixed(1)} KB (${s.path})`),
  ].join("\n")
}

export function formatSample(name: string): string {
  const sample = findSample(name)
  if (!sample) {
    return `No sample matched "${name}". Known samples: ${samples.map((s) => s.name).join(", ")}.`
  }
  return [
    `# ${sample.name}`,
    `${sample.path} · ${sample.bytes} bytes`,
    "",
    "```lobster",
    sample.code.trimEnd(),
    "```",
  ].join("\n")
}

export function formatSampleSearch(query: string, limit: number): string {
  const hits = searchSamples(query, limit)
  if (hits.length === 0) {
    return `No sample contains "${query}". Use list_samples to see the ${samples.length} samples.`
  }
  return [
    `${hits.length} sample(s) containing "${query}":`,
    ...hits.map((h) => `## ${h.sample.name}\n${h.snippet}`),
  ].join("\n")
}
