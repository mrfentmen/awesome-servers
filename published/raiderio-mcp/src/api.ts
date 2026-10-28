/**
 * Raider.IO — keyless public API client.
 */
const BASE = "https://raider.io/api/v1"
const SOURCE = "Raider.IO"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "raiderio-mcp", accept },
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

const region = (r: string): string => {
  if (!["eu", "us", "kr", "tw", "cn"].includes(r)) throw new SourceError(`"${r}" is not a supported region`)
  return r
}

export async function currentAffixes(a: { region: string }): Promise<string> {
  const d = await getJson(`/mythic-plus/affixes?region=${region(a.region)}&locale=en`)
  const affixes: any[] = d?.affix_details ?? d?.affixes ?? []
  if (!affixes.length) throw new SourceError("Raider.IO returned no affixes")
  return [
    `Mythic+ affixes for ${a.region.toUpperCase()} (${d.title ?? "this week"}):`,
    ...affixes.map((x, i) => `${i + 1}. ${x.name}${x.description ? ` - ${String(x.description).replace(/<[^>]+>/g, "").slice(0, 200)}` : ""}`),
  ].join("\n")
}

export async function recentMythicRuns(a: { region: string; season: string; limit: number }): Promise<string> {
  const season = a.season.trim()
  if (!/^[a-z0-9-]{3,40}$/.test(season)) throw new SourceError(`"${a.season}" is not a season slug`)
  const d = await getJson(`/mythic-plus/runs?season=${encodeURIComponent(season)}&region=${region(a.region)}&page=0`)
  const rows: any[] = d?.rankings ?? []
  if (!rows.length) return `No runs listed for ${season} in ${a.region.toUpperCase()}.`
  return [`Top ${Math.min(a.limit, rows.length)} recent ${season} runs in ${a.region.toUpperCase()}:`, ...rows.slice(0, a.limit).map((r, i) => {
    const run = r?.run ?? {}
    const members = (run?.roster ?? []).map((m: any) => `${m?.character?.name ?? "?"} (${m?.character?.spec?.name ?? "?"})`).slice(0, 5)
    const time = run?.clear_time_ms ? `${Math.floor(run.clear_time_ms / 60000)}m ${Math.round((run.clear_time_ms % 60000) / 1000)}s` : "?"
    return `${i + 1}. +${run?.mythic_level ?? "?"} ${run?.dungeon?.name ?? "dungeon"} - ${time}, score ${r?.score ?? "?"}${members.length ? `\n   ${members.join(", ")}` : ""}`
  })].join("\n")
}
