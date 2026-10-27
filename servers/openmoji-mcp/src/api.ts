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
// ---- batch-5 tools: SVG links, skin tone variants, emoji compare (2026-09-27) ----

// Skin-tone metadata lives in the dataset but was not part of the Emoji type
// the earlier tools read. Declarations merge, and a merged declaration must be
// exported on both sides, so this keeps the export keyword.
export interface Emoji {
  skintone?: number | string
  skintone_base_hexcode?: string
  skintone_combination?: string
  openmoji_tags?: string
  openmoji_author?: string
  openmoji_date?: string
  unicode?: number
}

const TONES: Record<string, string> = {
  "1F3FB": "light",
  "1F3FC": "medium-light",
  "1F3FD": "medium",
  "1F3FE": "medium-dark",
  "1F3FF": "dark",
}

const SVG_BASE = "https://openmoji.org/data"

const normalize = (value: string) => (value ?? "").trim().toUpperCase().replace(/^U\+/, "")

/** Find a dataset row by hexcode, by the emoji character itself, or by exact annotation. */
async function resolveEmoji(input: string): Promise<Emoji> {
  const wanted = (input ?? "").trim()
  if (!wanted) throw new OpenmojiError("Give an emoji, a hexcode such as 1F44D, or an annotation such as 'thumbs up'.")
  const all = await dataset()
  const hex = normalize(wanted)
  const found =
    all.find((e) => e.hexcode.toUpperCase() === hex) ??
    all.find((e) => e.emoji === wanted) ??
    all.find((e) => e.annotation.toLowerCase() === wanted.toLowerCase())
  if (!found) throw new OpenmojiError(`No OpenMoji entry matches "${input}".`)
  return found
}

const tagSet = (value: string | undefined) =>
  new Set((value ?? "").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))

/**
 * The two SVG files OpenMoji publishes for one emoji, checked before they are
 * handed over, because a designer pasting a URL wants it to work.
 */
export async function svgLinks(args: { hexcode: string }): Promise<string> {
  const entry = await resolveEmoji(args.hexcode)
  const hex = entry.hexcode.toUpperCase()
  const styles = ["color", "black"] as const
  const rows = await Promise.all(
    styles.map(async (style) => {
      const url = `${SVG_BASE}/${style}/svg/${hex}.svg`
      try {
        const res = await fetch(url, { method: "HEAD", headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) })
        const bytes = Number(res.headers.get("content-length") ?? 0)
        return {
          style,
          url,
          ok: res.ok,
          detail: res.ok ? `${res.headers.get("content-type") ?? "image/svg+xml"}${bytes ? `, ${(bytes / 1024).toFixed(1)} kB` : ""}` : `HTTP ${res.status}`,
        }
      } catch (e) {
        return { style, url, ok: false, detail: errorMessage(e) }
      }
    })
  )
  return [
    `SVG files for ${entry.emoji} (${hex}) — ${entry.annotation}`,
    "",
    ...rows.map((row) => `  ${row.style.padEnd(6)} ${row.ok ? "ok  " : "FAIL"} ${row.url}${row.ok ? ` (${row.detail})` : ` — ${row.detail}`}`),
    "",
    "OpenMoji is CC BY-SA 4.0, so credit the project wherever the artwork is used.",
  ].join("\n")
}

/**
 * The skin-tone run of one emoji, taken from the dataset's own base-hexcode
 * links rather than guessed from the code points.
 */
export async function skinToneVariants(args: { emoji: string }): Promise<string> {
  const base = await resolveEmoji(args.emoji)
  const all = await dataset()
  const variants = all
    .filter((e) => (e.skintone_base_hexcode ?? "").toUpperCase() === base.hexcode.toUpperCase() && e.hexcode.toUpperCase() !== base.hexcode.toUpperCase())
    .sort((a, b) => String(a.hexcode).localeCompare(String(b.hexcode)))
  if (!variants.length) {
    return [
      `${base.emoji} (${base.hexcode}) — ${base.annotation}`,
      "No skin-tone variants: this emoji is published in one form only.",
    ].join("\n")
  }
  return [
    `Skin-tone variants of ${base.emoji} (${base.hexcode}) — ${base.annotation}`,
    `  base: ${base.emoji} ${base.hexcode}`,
    "",
    ...variants.map((v) => {
      const tone = TONES[String(v.hexcode).split("-").pop() ?? ""] ?? "tone"
      return `  ${tone.padEnd(13)} ${v.emoji} ${v.hexcode} — ${v.annotation}`
    }),
    "",
    `OpenMoji stores ${variants.length} variant(s) for this emoji, in the tones above; the base emoji is used when none is chosen.`,
  ].join("\n")
}

/** Two emoji compared on the metadata that decides whether they are interchangeable. */
export async function compareEmoji(args: { a: string; b: string }): Promise<string> {
  const first = await resolveEmoji(args.a)
  const second = await resolveEmoji(args.b)
  const firstTags = tagSet(first.tags)
  const secondTags = tagSet(second.tags)
  const shared = [...firstTags].filter((t) => secondTags.has(t)).sort()
  const onlyFirst = [...firstTags].filter((t) => !secondTags.has(t)).sort().slice(0, 12)
  const onlySecond = [...secondTags].filter((t) => !firstTags.has(t)).sort().slice(0, 12)
  const overlap = firstTags.size && secondTags.size ? Math.round((shared.length / Math.min(firstTags.size, secondTags.size)) * 100) : 0
  return [
    `Emoji compare: ${first.emoji} ${first.hexcode} vs ${second.emoji} ${second.hexcode}`,
    `  ${first.annotation} | ${first.group} / ${first.subgroups}`,
    `  ${second.annotation} | ${second.group} / ${second.subgroups}`,
    "",
    first.group === second.group ? `Same group (${first.group}).` : `Different groups: ${first.group} vs ${second.group}.`,
    first.subgroups === second.subgroups
      ? `Same subgroup (${first.subgroups}).`
      : `Different subgroups: ${first.subgroups} vs ${second.subgroups}.`,
    `Tag overlap ${overlap}% — shared: ${shared.length ? shared.join(", ") : "none"}`,
    onlyFirst.length ? `  only in ${first.emoji}: ${onlyFirst.join(", ")}` : "",
    onlySecond.length ? `  only in ${second.emoji}: ${onlySecond.join(", ")}` : "",
    "",
    `Unicode version: ${first.unicode ?? "not stated"} vs ${second.unicode ?? "not stated"}; colours of the same subject usually share a subgroup, so a shared subgroup is the strongest signal that two emoji are near-duplicates.`,
  ].filter((line) => line !== "").join("\n")
}
