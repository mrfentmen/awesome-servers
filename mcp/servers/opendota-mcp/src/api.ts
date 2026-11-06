/**
 * OpenDota — Dota 2 hero stats. Keyless.
 *
 * Verified live: GET /api/heroStats returns 127 heroes with attributes, roles,
 * base stats and public pick/win counts.
 */
const API = "https://api.opendota.com/api/heroStats"

export class OpenDotaError extends Error {}

interface Hero {
  id?: number
  localized_name?: string
  primary_attr?: string
  attack_type?: string
  roles?: string[]
  base_health?: number
  base_mana?: number
  base_armor?: number
  base_attack_min?: number
  attack_range?: number
  move_speed?: number
  pub_pick?: number
  pub_win?: number
  pro_pick?: number
  pro_win?: number
}

async function get(timeoutMs = 30000): Promise<Hero[]> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(API, {
      signal: ctrl.signal,
      headers: { "user-agent": "opendota-mcp", accept: "application/json" },
    })
    if (!res.ok) throw new OpenDotaError(`OpenDota responded ${res.status}`)
    const body = (await res.json()) as unknown
    if (!Array.isArray(body)) throw new OpenDotaError("OpenDota returned an unexpected shape")
    return body as Hero[]
  } catch (e) {
    if (e instanceof OpenDotaError) throw e
    if ((e as Error).name === "AbortError") throw new OpenDotaError("OpenDota request timed out")
    throw new OpenDotaError(`OpenDota request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

const clamp = (n: number, lo: number, hi: number): number => (Number.isInteger(n) ? Math.min(hi, Math.max(lo, n)) : lo)

const winRate = (h: Hero): string => {
  const picks = h.pub_pick ?? 0
  const wins = h.pub_win ?? 0
  if (picks === 0) return "no public games"
  return `${((wins / picks) * 100).toFixed(1)}% win rate from ${picks} pubs`
}

export async function heroes(role?: string, attr?: string, limit = 20): Promise<string> {
  const all = await get()
  if (all.length === 0) throw new OpenDotaError("OpenDota returned no heroes")

  const wantRole = role?.trim().toLowerCase()
  const wantAttr = attr?.trim().toLowerCase()
  const filtered = all.filter((h) => {
    const roles = (h.roles ?? []).map((r) => r.toLowerCase())
    if (wantRole !== undefined && wantRole !== "" && !roles.includes(wantRole)) return false
    if (wantAttr !== undefined && wantAttr !== "" && (h.primary_attr ?? "").toLowerCase() !== wantAttr) return false
    return true
  })

  if (filtered.length === 0) return `No Dota 2 heroes match${wantRole ? ` role ${wantRole}` : ""}${wantAttr ? ` attribute ${wantAttr}` : ""}.`

  filtered.sort((a, b) => (b.pub_pick ?? 0) - (a.pub_pick ?? 0))
  const size = clamp(limit, 1, 127)
  const top = filtered.slice(0, size)

  const lines = top.flatMap((h, i) => [
    `${i + 1}. ${h.localized_name ?? "unknown"} — ${h.primary_attr ?? "?"}, ${h.attack_type ?? "?"}, ${(h.roles ?? []).join("/") || "no roles"}`,
    `   ${winRate(h)}${h.pro_pick ? ` · pro picks ${h.pro_pick}` : ""}`,
  ])

  return [`Dota 2 heroes — ${filtered.length} match${filtered.length === 1 ? "" : "es"}, showing ${top.length}`, "", ...lines].join("\n")
}

export async function hero(name: string): Promise<string> {
  const wanted = name.trim().toLowerCase()
  if (wanted === "") throw new OpenDotaError("name must not be empty")

  const all = await get()
  const h =
    all.find((x) => (x.localized_name ?? "").toLowerCase() === wanted) ??
    all.find((x) => (x.localized_name ?? "").toLowerCase().replace(/[^a-z0-9]/g, "") === wanted.replace(/[^a-z0-9]/g, ""))

  if (!h) throw new OpenDotaError(`OpenDota has no hero called "${name}"`)

  return [
    h.localized_name ?? "unknown",
    "",
    `Attribute: ${h.primary_attr ?? "?"}`,
    `Attack: ${h.attack_type ?? "?"}`,
    `Roles: ${(h.roles ?? []).join(", ") || "none listed"}`,
    `Health: ${h.base_health ?? "?"} · Mana: ${h.base_mana ?? "?"} · Armour: ${h.base_armor ?? "?"}`,
    `Base attack: ${h.base_attack_min ?? "?"} · Range: ${h.attack_range ?? "?"} · Speed: ${h.move_speed ?? "?"}`,
    "",
    `Public: ${winRate(h)}`,
    h.pro_pick ? `Pro: ${h.pro_win ?? 0} wins from ${h.pro_pick} picks` : "Pro: never picked",
  ].join("\n")
}
