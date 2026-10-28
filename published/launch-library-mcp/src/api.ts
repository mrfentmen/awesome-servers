/**
 * Launch Library 2 by The Space Devs. Keyless, rate limited to ~15 requests
 * per hour per IP on the free tier, so this server keeps calls small.
 * v2.3.0 endpoints verified live.
 */
const BASE = "https://ll.thespacedevs.com/2.3.0"

export class LaunchLibraryError extends Error {}

async function getJson(path: string, timeoutMs = 30000): Promise<any> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${BASE}${path}`, {
      signal: ctrl.signal,
      headers: { "user-agent": "launch-library-mcp", accept: "application/json" },
    })
    if (res.status === 404) throw new LaunchLibraryError("Launch Library has no record for that id")
    if (res.status === 429) throw new LaunchLibraryError("Launch Library free tier is rate limited — wait a few minutes")
    if (!res.ok) throw new LaunchLibraryError(`Launch Library responded ${res.status}`)
    return await res.json()
  } catch (e) {
    if (e instanceof LaunchLibraryError) throw e
    if ((e as Error).name === "AbortError") throw new LaunchLibraryError("Launch Library request timed out")
    if (e instanceof SyntaxError) throw new LaunchLibraryError("Launch Library returned malformed JSON")
    throw new LaunchLibraryError(`Launch Library request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

const when = (iso: unknown): string => {
  const s = String(iso ?? "")
  if (!s) return "date unknown"
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return `${d.toISOString().slice(0, 16).replace("T", " ")}Z`
}

function line(l: any, i?: number): string {
  const prefix = typeof i === "number" ? `${i + 1}. ` : "• "
  const provider = l.launch_service_provider?.name ?? "provider unknown"
  const rocket = l.rocket?.configuration?.name ?? "rocket unknown"
  const pad = l.pad ? `${l.pad.name} — ${l.pad.location?.name ?? ""}`.trim() : "pad unknown"
  const mission = l.mission?.name ? ` · mission ${l.mission.name}${l.mission.orbit?.abbrev ? ` (${l.mission.orbit.abbrev})` : ""}` : ""
  return [
    `${prefix}${l.name}`,
    `   ${when(l.net)} · ${l.status?.abbrev ?? "?"} · ${provider}`,
    `   ${rocket} · ${pad}${mission}`,
    `   id ${l.id}`,
  ].join("\n")
}

export async function upcomingLaunches(limit: number): Promise<string> {
  const d = await getJson(`/launches/upcoming/?limit=${limit}&ordering=net`)
  const rows: any[] = d?.results ?? []
  if (rows.length === 0) return "No upcoming launches listed."
  return [
    `Next ${rows.length} launches (of ${Number(d.count ?? rows.length).toLocaleString("en-US")} scheduled):`,
    "",
    ...rows.map((l, i) => line(l, i)),
  ].join("\n")
}

export async function recentLaunches(limit: number): Promise<string> {
  const d = await getJson(`/launches/previous/?limit=${limit}&ordering=-net`)
  const rows: any[] = d?.results ?? []
  if (rows.length === 0) return "No previous launches listed."
  const lines = rows.map((l, i) => {
    const ok = String(l.status?.abbrev ?? "").toLowerCase() === "success"
    return `${line(l, i)}\n   outcome: ${l.status?.abbrev ?? "unknown"}${ok ? " ✓" : ""}`
  })
  return [`Last ${rows.length} launches:`, "", ...lines].join("\n")
}

export async function launchDetail(id: string): Promise<string> {
  const clean = id.trim()
  if (!/^[0-9a-f-]{20,40}$/i.test(clean)) throw new LaunchLibraryError(`"${id}" is not a Launch Library id`)
  const l = await getJson(`/launches/${clean}/`)
  const mission = l.mission ?? {}
  return [
    `${l.name}`,
    `Status: ${l.status?.name ?? l.status?.abbrev ?? "unknown"} · NET ${when(l.net)}${l.net_precision?.name ? ` (${l.net_precision.name})` : ""}`,
    `Window: ${when(l.window_start)} → ${when(l.window_end)}`,
    `Provider: ${l.launch_service_provider?.name ?? "?"}`,
    `Rocket: ${l.rocket?.configuration?.name ?? "?"}${l.rocket?.configuration?.full_name ? ` — ${l.rocket.configuration.full_name}` : ""}`,
    `Pad: ${l.pad?.name ?? "?"}${l.pad?.location?.name ? `, ${l.pad.location.name}` : ""}`,
    l.probability !== null && l.probability !== undefined ? `Weather probability: ${l.probability}%` : "",
    mission.name ? `\nMission: ${mission.name}` : "",
    mission.orbit?.name ? `Orbit: ${mission.orbit.name}${mission.orbit.abbrev ? ` (${mission.orbit.abbrev})` : ""}` : "",
    mission.description ? `\n${String(mission.description).replace(/\s+/g, " ").slice(0, 600)}` : "",
    l.failreason ? `\nFailure reason: ${l.failreason}` : "",
    "",
    l.image ? `Image: ${typeof l.image === "string" ? l.image : l.image.image_url ?? ""}` : "",
  ]
    .filter((x) => x !== "")
    .join("\n")
}

export async function launchesBySearch(term: string, limit: number): Promise<string> {
  const q = term.trim()
  if (q.length < 2) throw new LaunchLibraryError("Search term must be at least 2 characters")
  const d = await getJson(`/launches/?search=${encodeURIComponent(q)}&limit=${limit}&ordering=-net`)
  const rows: any[] = d?.results ?? []
  if (rows.length === 0) return `No launches match "${term}".`
  return [
    `Launches matching "${term}" (${Number(d.count ?? rows.length).toLocaleString("en-US")} on record, newest first):`,
    "",
    ...rows.map((l, i) => line(l, i)),
  ].join("\n")
}

export async function upcomingEvents(limit: number): Promise<string> {
  const d = await getJson(`/events/upcoming/?limit=${limit}&ordering=date`)
  const rows: any[] = d?.results ?? []
  if (rows.length === 0) return "No upcoming space events listed."
  return [
    `Upcoming space events (${rows.length} of ${Number(d.count ?? rows.length)}):`,
    "",
    ...rows.map((e, i) => {
      const loc = e.location ?? "location TBA"
      return `${i + 1}. ${e.name}\n   ${when(e.date)} · ${e.type?.name ?? "event"} · ${loc}`
    }),
  ].join("\n")
}

export async function listAgencies(limit: number, country?: string): Promise<string> {
  // country_code wants the 3-letter ISO form (USA, JPN); 2-letter codes return nothing.
  const q = country ? `&country_code=${encodeURIComponent(country.trim().toUpperCase())}` : ""
  const d = await getJson(`/agencies/?limit=${limit}${q}`)
  const rows: any[] = d?.results ?? []
  if (rows.length === 0) {
    return country
      ? `No agencies for ${country.toUpperCase()}. Use the 3-letter ISO code (USA, JPN, FRA).`
      : "No agencies listed."
  }
  const codeOf = (a: any): string =>
    Array.isArray(a.country_code)
      ? a.country_code.map((c: any) => c?.alpha_3_code ?? c).join(", ")
      : String(a.country_code ?? "?")
  return [
    `Space agencies (${rows.length} of ${Number(d.count ?? rows.length).toLocaleString("en-US")}${country ? ` for ${country.toUpperCase()}` : ""}):`,
    "",
    ...rows.map((a, i) => `${i + 1}. ${a.name} [${a.abbrev ?? "no abbrev"}] — ${codeOf(a)} · ${a.type?.name ?? "type unknown"}`),
  ].join("\n")
}
