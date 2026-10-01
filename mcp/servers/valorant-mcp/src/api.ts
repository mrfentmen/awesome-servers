const BASE = "https://valorant-api.com/v1"
const UA = "mrfentmen-valorant-mcp/1.0 (https://github.com/mrfentmen)"
export class ValorantError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new ValorantError(`Valorant API returned HTTP ${res.status}`)
  return (await res.json()) as T
}

export async function agents(args: { language?: string }): Promise<string> {
  const lang = (args.language ?? "en-US").trim()
  const d = await get<any>(`${BASE}/agents?language=${encodeURIComponent(lang)}`)
  const list = ((d?.data ?? []) as any[]).filter((a: any) => a?.isPlayableCharacter !== false)
  if (!list.length) return "No agents found"
  return `Valorant agents (${list.length}):\n` + list.map((a, i) => {
    const role = a?.role?.displayName ?? "no role"
    return `${i + 1}. ${a?.displayName ?? "n/a"} | ${role}\n   ${(a?.description ?? "").slice(0, 120)}`
  }).join("\n")
}

export async function agent(args: { uuid?: string; language?: string }): Promise<string> {
  const uuid = (args.uuid ?? "").trim()
  if (!uuid) throw new ValorantError("Provide an agent UUID")
  const lang = (args.language ?? "en-US").trim()
  const d = await get<any>(`${BASE}/agents/${encodeURIComponent(uuid)}?language=${encodeURIComponent(lang)}`)
  const a = d?.data
  if (!a) throw new ValorantError(`Agent not found: ${uuid}`)
  const lines = [
    `${a?.displayName ?? "n/a"} | ${a?.role?.displayName ?? ""}`,
    `${a?.description ?? ""}`,
  ]
  if (a?.abilities?.length) {
    lines.push("", "Abilities:")
    a.abilities.forEach((ab: any, i: number) => lines.push(`${i + 1}. ${ab?.displayName ?? ""}: ${(ab?.description ?? "").slice(0, 140)}`))
  }
  return lines.join("\n")
}

export async function maps(_args?: unknown): Promise<string> {
  const d = await get<any>(`${BASE}/maps`)
  const list = (d?.data ?? []) as any[]
  if (!list.length) return "No maps found"
  return `Valorant maps (${list.length}):\n` + list.map((m, i) => {
    const coords = m?.coordinates ?? "unknown"
    return `${i + 1}. ${m?.displayName ?? "n/a"} | coords ${coords}`
  }).join("\n")
}

export async function weapons(_args?: unknown): Promise<string> {
  const d = await get<any>(`${BASE}/weapons`)
  const list = (d?.data ?? []) as any[]
  if (!list.length) return "No weapons found"
  return `Valorant weapons (${list.length}):\n` + list.map((w, i) => {
    const cost = w?.shopData?.cost
    return `${i + 1}. ${w?.displayName ?? "n/a"} | ${w?.category ?? ""}${cost != null ? ` | ${cost} credits` : ""}`
  }).join("\n")
}

// ---- gap2d tools:

// The two routes below are ones the server never reached: the single-map record
// (which carries the named callouts, not just the map's name) and the game-mode
// roster (which no existing tool touches at all).

interface ValorantMapDetail {
  uuid?: string
  displayName?: string
  tacticalDescription?: string | null
  narrativeDescription?: string | null
  coordinates?: string | null
  splash?: string | null
  listViewIcon?: string | null
  callouts?: Array<{ regionName?: string | null; superRegionName?: string | null }> | null
}

interface ValorantGameMode {
  uuid?: string
  displayName?: string
  description?: string | null
  duration?: number | null
  roundsPerHalf?: number | null
  economyType?: string | null
  orbCount?: number | null
  allowsMatchTimeouts?: boolean
  isMinimapHidden?: boolean
}

/** The game-mode roster, with the rules each mode is played under. */
export async function gameModes(_args?: unknown): Promise<string> {
  const d = await get<{ data?: ValorantGameMode[] }>(`${BASE}/gamemodes`)
  const list = d.data ?? []
  if (!list.length) return 'No game modes found'
  return `Valorant game modes (${list.length}):\n` +
    list
      .map((m, i) => {
        // The API uses -1 for "this rule does not apply to this mode", so a
        // truthiness check is not enough: only positive values are reported.
        const rounds = Number(m.roundsPerHalf)
        const minutes = Number(m.duration) / 60000
        const orbs = Number(m.orbCount)
        const rules = [
          m.economyType ? `economy ${m.economyType}` : '',
          Number.isFinite(rounds) && rounds > 0 ? `${rounds} rounds per half` : '',
          Number.isFinite(minutes) && minutes > 0 ? `${Math.round(minutes)} min limit` : '',
          Number.isFinite(orbs) && orbs > 0 ? `${orbs} orbs` : '',
        ]
          .filter(Boolean)
          .join(', ')
        const flags = [
          m.isMinimapHidden ? 'minimap hidden' : '',
          m.allowsMatchTimeouts ? 'timeouts allowed' : '',
        ]
          .filter(Boolean)
          .join(', ')
        const detail = [rules, flags].filter(Boolean).join(' | ')
        return (
          `${i + 1}. ${m.displayName ?? 'unnamed'} — uuid ${m.uuid ?? 'not reported'}\n` +
          `   ${(m.description ?? 'no description reported').slice(0, 200)}` +
          (detail ? `\n   ${detail}` : '')
        )
      })
      .join('\n')
}
