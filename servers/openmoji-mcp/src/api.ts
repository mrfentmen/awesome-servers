/**
 * OpenMoji client, keyless.
 * The whole emoji dataset is one public JSON file, cached in memory per process.
 */

export class OpenmojiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "OpenmojiError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = "mrfentmen-openmoji-mcp/1.0"

const SOURCES = [
  "https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/data/openmoji.json",
  "https://cdn.jsdelivr.net/npm/openmoji@15.0.0/data/openmoji.json",
]

export interface Emoji {
  hexcode: string
  emoji: string
  annotation: string
  group: string
  subgroups: string
  tags: string
  order?: number
}

let cache: Emoji[] | null = null

async function dataset(): Promise<Emoji[]> {
  if (cache) return cache
  let lastError = "unknown error"
  for (const url of SOURCES) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
      })
      if (!res.ok) {
        lastError = `HTTP ${res.status}`
        continue
      }
      const rows = (await res.json()) as Emoji[]
      if (!Array.isArray(rows) || rows.length === 0) {
        lastError = "empty dataset"
        continue
      }
      cache = rows
      return cache
    } catch (e) {
      lastError = errorMessage(e)
    }
  }
  throw new OpenmojiError(`Could not load the OpenMoji dataset (${lastError}).`)
}

export async function emojiCount(): Promise<number> {
  return (await dataset()).length
}


export async function searchEmoji(query: string, limit: number): Promise<string> {
  const q = query.trim().toLowerCase()
  if (!q) throw new OpenmojiError("A search keyword is required.")
  const size = clamp(limit, 1, 50, 10)
  const hits = (await dataset())
    .filter(
      (e) =>
        e.annotation.toLowerCase().includes(q) ||
        (e.tags ?? "").toLowerCase().includes(q) ||
        e.group.toLowerCase().includes(q) ||
        (e.subgroups ?? "").toLowerCase().includes(q)
    )
    .slice(0, size)
  if (hits.length === 0) return `No OpenMoji emoji match "${query}".`
  return formatList(hits, `OpenMoji results for "${query}"`)
}

export async function getEmoji(hexcode: string): Promise<string> {
  const wanted = hexcode.trim().toUpperCase().replace(/^U\+/, "")
  if (!/^[0-9A-F]{1,10}(-[0-9A-F]{1,10})*$/.test(wanted)) {
    throw new OpenmojiError(`"${hexcode}" is not a hexcode, e.g. '1F431' or '1F468-200D-1F4BB'.`)
  }
  const all = await dataset()
  const found = all.find((e) => e.hexcode.toUpperCase() === wanted)
  if (!found) throw new OpenmojiError(`No OpenMoji emoji with hexcode ${wanted}.`)
  return [
    `${found.emoji}  ${found.annotation}`,
    `  hexcode    ${found.hexcode}`,
    `  group      ${found.group}`,
    `  subgroup   ${found.subgroups}`,
    `  tags       ${found.tags || "none"}`,
    `  SVG        https://openmoji.org/data/color/svg/${found.hexcode}.svg`,
  ].join("\n")
}

export async function listGroups(): Promise<string> {
  const all = await dataset()
  const counts = new Map<string, number>()
  for (const e of all) counts.set(e.group, (counts.get(e.group) ?? 0) + 1)
  const lines = [...counts.entries()].map(([g, n]) => `  ${g.padEnd(24)} ${n}`)
  return `${counts.size} OpenMoji groups (${all.length} emoji total):\n\n${lines.join("\n")}`
}

export async function listSubgroups(group: string): Promise<string> {
  const all = await dataset()
  const target = matchGroup(all, group)
  const counts = new Map<string, number>()
  for (const e of all) {
    if (e.group !== target) continue
    counts.set(e.subgroups, (counts.get(e.subgroups) ?? 0) + 1)
  }
  if (counts.size === 0) throw new OpenmojiError(`No OpenMoji group called "${group}".`)
  const lines = [...counts.entries()].map(([s, n]) => `  ${s.padEnd(28)} ${n}`)
  return `Subgroups of ${target}:\n\n${lines.join("\n")}`
}

export async function emojisInGroup(group: string, subgroup: string | undefined, limit: number): Promise<string> {
  const all = await dataset()
  const target = matchGroup(all, group)
  const size = clamp(limit, 1, 100, 25)
  let rows = all.filter((e) => e.group === target)
  if (subgroup && subgroup.trim()) {
    const sub = subgroup.trim().toLowerCase()
    rows = rows.filter((e) => e.subgroups.toLowerCase().includes(sub))
    if (rows.length === 0) {
      throw new OpenmojiError(`No subgroup of ${target} matches "${subgroup}".`)
    }
  }
  const title = `${target}${subgroup ? ` / ${subgroup}` : ""}`
  return formatList(rows.slice(0, size), `${title} - ${rows.length} emoji, showing ${Math.min(size, rows.length)}`)
}

export async function randomEmoji(group: string | undefined): Promise<string> {
  const all = await dataset()
  let pool = all
  if (group && group.trim()) {
    const target = matchGroup(all, group)
    pool = all.filter((e) => e.group === target)
  }
  const pick = pool[Math.floor(Math.random() * pool.length)]
  return [
    `${pick.emoji}  ${pick.annotation}`,
    `  hexcode    ${pick.hexcode}`,
    `  group      ${pick.group}`,
    `  subgroup   ${pick.subgroups}`,
  ].join("\n")
}

export async function emojiStats(): Promise<string> {
  const all = await dataset()
  const groups = new Map<string, number>()
  for (const e of all) groups.set(e.group, (groups.get(e.group) ?? 0) + 1)
  const sequenced = all.filter((e) => e.hexcode.includes("-")).length
  const largest = [...groups.entries()].sort((a, b) => b[1] - a[1])[0]
  return [
    "OpenMoji dataset statistics",
    "",
    `  emoji total      ${all.length}`,
    `  groups           ${groups.size}`,
    `  sequences (ZWJ)  ${sequenced}`,
    `  largest group    ${largest ? `${largest[0]} (${largest[1]})` : "n/a"}`,
    "",
    "Source: openmoji.org, CC BY-SA 4.0.",
  ].join("\n")
}

/** Group names in the dataset are slugs ('animals-nature'), users type 'Animals & Nature'. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\band\b/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function matchGroup(all: Emoji[], group: string): string {
  const g = slugify(group)
  if (!g) throw new OpenmojiError("A group name is required - call list_groups for the options.")
  const names = [...new Set(all.map((e) => e.group))]
  const exact = names.find((n) => slugify(n) === g)
  if (exact) return exact
  const partial = names.find((n) => slugify(n).includes(g) || g.includes(slugify(n)))
  if (partial) return partial
  throw new OpenmojiError(`No OpenMoji group matches "${group}". Groups: ${names.join(", ")}.`)
}

function clamp(value: number, min: number, max: number, fallback: number): number {
  const n = Number.isFinite(value) ? value : fallback
  return Math.min(Math.max(Math.round(n), min), max)
}

function formatList(rows: Emoji[], title: string): string {
  const lines = rows.map(
    (e) => `  ${e.emoji}  ${e.annotation.padEnd(28)} ${e.hexcode}`
  )
  return `${title}:\n\n${lines.join("\n")}`
}
