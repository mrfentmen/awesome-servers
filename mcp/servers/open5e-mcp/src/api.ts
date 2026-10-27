/**
 * Open5e (D&D 5e SRD) — keyless public API client.
 */
const BASE = "https://api.open5e.com"
const SOURCE = "Open5e (D&D 5e SRD)"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "open5e-mcp", accept },
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

function abs(path: string): string {
  return path.startsWith("/v1/") || path.startsWith("http") ? path : `/v1${path}`
}

function trim(text: string, max: number): string {
  const t = clean(text)
  return t.length > max ? `${t.slice(0, max)}…` : t
}

export async function searchSpells(a: { query: string; level?: number; limit?: number }): Promise<string> {
  const q = clean(a.query)
  if (q.length < 2) throw new SourceError("query must be at least 2 characters")
  const limit = a.limit ?? 5
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new SourceError("limit must be between 1 and 20")
  if (a.level !== undefined && (!Number.isInteger(a.level) || a.level < 0 || a.level > 9)) throw new SourceError("level must be between 0 and 9")
  const level = a.level !== undefined ? `&level_int=${a.level}` : ""
  const d = await getJson(`/v1/spells/?search=${encodeURIComponent(q)}${level}&limit=${limit}`)
  const rows: any[] = d?.results ?? []
  if (!rows.length) return `Open5e lists no spell matching "${q}"${a.level !== undefined ? ` at level ${a.level}` : ""}.`
  return [
    `${d.count ?? rows.length} spell(s) match "${q}"${a.level !== undefined ? ` at level ${a.level}` : ""} (showing ${rows.length}):`,
    "",
    ...rows.map((s) => [
      `${clean(s.name)} - level ${s.level_int ?? "?"} ${clean(s.school) || "?"} (${clean(s.document__title) || "SRD"})`,
      `  ${clean(s.casting_time) || "?"} · range ${clean(s.range) || "?"} · ${clean(s.components) || "?"} · ${clean(s.duration) || "?"}`,
      `  ${trim(s.desc, 260)}`,
    ].join("\n")),
  ].join("\n")
}

export async function spellDetail(a: { slug: string }): Promise<string> {
  const slug = clean(a.slug).toLowerCase()
  if (!/^[a-z0-9-]{2,60}$/.test(slug)) throw new SourceError("slug must be lowercase letters, digits and dashes")
  const s = await getJson(abs(`/spells/${slug}/`))
  if (!s || !s.name) throw new SourceError(`Open5e has no spell with slug ${slug}`)
  return [
    `${clean(s.name)}`,
    `Level ${s.level_int ?? "?"} ${clean(s.school) || "?"}${s.ritual ? " (ritual)" : ""}${s.concentration ? " · concentration" : ""} · source ${clean(s.document__title) || "SRD"}`,
    `Casting time: ${clean(s.casting_time) || "?"} · range: ${clean(s.range) || "?"} · components: ${clean(s.components) || "?"} · duration: ${clean(s.duration) || "?"}`,
    Array.isArray(s.classes) && s.classes.length ? `Classes: ${s.classes.join(", ")}` : "",
    "",
    clean(s.desc),
    s.higher_level ? `\nAt higher levels: ${clean(s.higher_level)}` : "",
    s.page ? `\nSRD page ${clean(s.page)}` : "",
  ].filter(Boolean).join("\n")
}

export async function searchMonsters(a: { query: string; limit?: number }): Promise<string> {
  const q = clean(a.query)
  if (q.length < 2) throw new SourceError("query must be at least 2 characters")
  const limit = a.limit ?? 5
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new SourceError("limit must be between 1 and 20")
  const d = await getJson(`/v1/monsters/?search=${encodeURIComponent(q)}&limit=${limit}`)
  const rows: any[] = d?.results ?? []
  if (!rows.length) return `Open5e lists no monster matching "${q}".`
  return [
    `${d.count ?? rows.length} monster(s) match "${q}" (showing ${rows.length}):`,
    "",
    ...rows.map((m) => [
      `${clean(m.name)} - ${clean(m.size) || "?"} ${clean(m.type) || "?"}${m.subtype ? ` (${clean(m.subtype)})` : ""} · CR ${m.challenge_rating ?? "?"} · AC ${m.armor_class ?? "?"} · ${m.hit_points ?? "?"} HP`,
      `  ${clean(m.alignment) || "unaligned"}${m.environments?.length ? ` · found in ${m.environments.join(", ")}` : ""}${m.document__title ? ` · ${clean(m.document__title)}` : ""}`,
    ].join("\n")),
  ].join("\n")
}

export async function monsterDetail(a: { slug: string }): Promise<string> {
  const slug = clean(a.slug).toLowerCase()
  if (!/^[a-z0-9-]{2,80}$/.test(slug)) throw new SourceError("slug must be lowercase letters, digits and dashes")
  const m = await getJson(abs(`/monsters/${slug}/`))
  if (!m || !m.name) throw new SourceError(`Open5e has no monster with slug ${slug}`)
  const abilities = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"]
    .map((k) => `${k.slice(0, 3).toUpperCase()} ${m[k] ?? "?"}`)
    .join(" · ")
  const traits = (list: any[]) => (list ?? []).map((t) => `  ${clean(t.name)}: ${trim(t.desc, 300)}`)
  return [
    `${clean(m.name)} - ${clean(m.size) || "?"} ${clean(m.type) || "?"}${m.subtype ? ` (${clean(m.subtype)})` : ""}, ${clean(m.alignment) || "unaligned"}`,
    `AC ${m.armor_class ?? "?"}${m.armor_desc ? ` (${clean(m.armor_desc)})` : ""} · HP ${m.hit_points ?? "?"}${m.hit_dice ? ` (${clean(m.hit_dice)})` : ""} · speed ${Object.entries(m.speed ?? {}).map(([k, v]) => `${k} ${v}`).join(", ") || "?"}`,
    abilities,
    `CR ${m.challenge_rating ?? "?"} (${m.cr ?? "?"}) · saves: ${["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"].filter((k) => m[`${k}_save`]).map((k) => `${k.slice(0, 3)} +${m[`${k}_save`]}`).join(", ") || "none listed"}`,
    m.skills ? `Skills: ${Object.entries(m.skills).map(([k, v]) => `${k} +${v}`).join(", ")}` : "",
    m.senses ? `Senses: ${clean(m.senses)}` : "",
    `Languages: ${clean(m.languages) || "none"}${m.damage_resistances ? ` · resists ${clean(m.damage_resistances)}` : ""}${m.damage_immunities ? ` · immune ${clean(m.damage_immunities)}` : ""}${m.condition_immunities ? ` · immune to ${clean(m.condition_immunities)}` : ""}`,
    Array.isArray(m.special_abilities) && m.special_abilities.length ? `\nTraits:\n${traits(m.special_abilities).join("\n")}` : "",
    Array.isArray(m.actions) && m.actions.length ? `\nActions:\n${traits(m.actions).join("\n")}` : "",
    Array.isArray(m.legendary_actions) && m.legendary_actions.length ? `\nLegendary actions:\n${traits(m.legendary_actions).join("\n")}` : "",
    m.document__title ? `\nSource: ${clean(m.document__title)}${m.document__license_url ? ` (${clean(m.document__license_url)})` : ""}` : "",
  ].filter(Boolean).join("\n")
}
