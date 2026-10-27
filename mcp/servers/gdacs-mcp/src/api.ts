/**
 * GDACS (Global Disaster Alert and Coordination System) — keyless GeoJSON.
 *
 * The SEARCH endpoint (by date range) takes anywhere from 5 to 90 seconds on
 * GDACS' side, so every tool here uses the MAP endpoint instead: it returns the
 * current event list per hazard type in about five seconds.
 */
const BASE = "https://www.gdacs.org/gdacsapi/api/events"

export class GdacsError extends Error {}

export const EVENT_TYPES: Record<string, string> = {
  EQ: "Earthquake",
  TC: "Tropical cyclone",
  FL: "Flood",
  VO: "Volcano",
  WF: "Wildfire",
  DR: "Drought",
}

export const TYPE_CODES = Object.keys(EVENT_TYPES)
export const ALERT_LEVELS = ["Green", "Orange", "Red"] as const

async function getJson(url: string, timeoutMs = 60000): Promise<any> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "user-agent": "gdacs-mcp", accept: "application/json" },
    })
    if (res.status === 404) throw new GdacsError("GDACS has no data for that request")
    if (!res.ok) throw new GdacsError(`GDACS responded ${res.status}`)
    return await res.json()
  } catch (e) {
    if (e instanceof GdacsError) throw e
    if ((e as Error).name === "AbortError") throw new GdacsError("GDACS request timed out")
    if (e instanceof SyntaxError) throw new GdacsError("GDACS returned malformed JSON")
    throw new GdacsError(`GDACS request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

interface Feature {
  geometry?: { type?: string; coordinates?: number[] | number[][] }
  properties?: Record<string, any>
}

const RANK: Record<string, number> = { Red: 0, Orange: 1, Green: 2 }

async function fetchType(type: string): Promise<Feature[]> {
  const code = type.trim().toUpperCase()
  if (!EVENT_TYPES[code]) throw new GdacsError(`Unknown hazard type "${type}" — use ${TYPE_CODES.join(", ")}`)
  const d = await getJson(`${BASE}/geteventlist/MAP?eventtype=${code}`)
  return Array.isArray(d?.features) ? d.features : []
}

function reportUrl(p: Record<string, any>): string {
  const u = p.url
  if (typeof u === "string") return u
  return u?.report ?? u?.details ?? ""
}

function eventLine(f: Feature, i?: number): string {
  const p = f.properties ?? {}
  const prefix = typeof i === "number" ? `${i + 1}. ` : "• "
  const sev = p.severitydata?.severitytext ?? ""
  const c = f.geometry?.coordinates
  const point = Array.isArray(c) && typeof c[0] === "number" ? `${(c as number[])[1]}, ${(c as number[])[0]}` : ""
  return [
    `${prefix}${p.alertlevel} ${p.eventtype} — ${p.name ?? "unnamed"} [id ${p.eventid}, episode ${p.episodeid ?? "?"}]`,
    `   ${String(p.fromdate ?? "").slice(0, 10)} · ${p.country ?? "country unknown"} · score ${p.alertscore ?? "n/a"}`,
    sev ? `   ${String(sev).slice(0, 130)}` : "",
    point ? `   ${point} · ${reportUrl(p)}` : `   ${reportUrl(p)}`,
  ]
    .filter(Boolean)
    .join("\n")
}

function sortFeatures(rows: Feature[]): Feature[] {
  return rows.slice().sort((a, b) => {
    const ra = RANK[String(a.properties?.alertlevel)] ?? 3
    const rb = RANK[String(b.properties?.alertlevel)] ?? 3
    if (ra !== rb) return ra - rb
    return String(b.properties?.fromdate ?? "").localeCompare(String(a.properties?.fromdate ?? ""))
  })
}

export async function currentEvents(args: { types?: string[]; levels?: string[]; limit: number }): Promise<string> {
  const types = args.types && args.types.length ? args.types : TYPE_CODES
  const batches = await Promise.all(types.map((t) => fetchType(t)))
  const all = batches.flat()
  const wanted = args.levels && args.levels.length ? new Set(args.levels.map((l) => l.toLowerCase())) : null
  const rows = sortFeatures(
    wanted ? all.filter((f) => wanted.has(String(f.properties?.alertlevel ?? "").toLowerCase())) : all
  )
  if (rows.length === 0) return "GDACS reports no current events for that filter."
  const summary = TYPE_CODES.map((code) => {
    const n = rows.filter((f) => f.properties?.eventtype === code).length
    return n ? `${EVENT_TYPES[code]} ${n}` : ""
  }).filter(Boolean)
  return [
    `Current GDACS alerts (${rows.length} events across ${types.length} hazard types):`,
    summary.join(" · "),
    "",
    ...rows.slice(0, args.limit).map((f, i) => eventLine(f, i)),
  ].join("\n")
}

export async function activeByType(type: string, limit: number): Promise<string> {
  const code = type.trim().toUpperCase()
  const rows = sortFeatures(await fetchType(code))
  if (rows.length === 0) return `No current ${EVENT_TYPES[code] ?? code} events.`
  const current = rows.filter((f) => String(f.properties?.iscurrent) === "true")
  return [
    `Current ${EVENT_TYPES[code]} events (${current.length} current of ${rows.length} listed):`,
    "",
    ...rows.slice(0, limit).map((f, i) => eventLine(f, i)),
  ].join("\n")
}

export async function alertSummary(): Promise<string> {
  const batches = await Promise.all(TYPE_CODES.map((t) => fetchType(t)))
  const all = batches.flat()
  const byLevel = ALERT_LEVELS.map((lvl) => [lvl, all.filter((f) => f.properties?.alertlevel === lvl).length] as const)
  const byType = TYPE_CODES.map(
    (code) => [EVENT_TYPES[code], all.filter((f) => f.properties?.eventtype === code).length] as const
  ).filter(([, n]) => n > 0)
  const worst = sortFeatures(all)[0]
  return [
    `GDACS is tracking ${all.length} events right now.`,
    "",
    `By alert level: ${byLevel.map(([l, n]) => `${l} ${n}`).join(", ")}`,
    `By hazard: ${byType.map(([t, n]) => `${t} ${n}`).join(", ") || "none"}`,
    "",
    worst ? `Most severe right now:\n${eventLine(worst)}` : "Nothing active.",
  ].join("\n")
}

export async function eventDetail(eventId: number, eventType: string): Promise<string> {
  const type = eventType.trim().toUpperCase()
  if (!EVENT_TYPES[type]) throw new GdacsError(`eventType must be one of ${TYPE_CODES.join(", ")}`)
  const d = await getJson(`${BASE}/geteventdata?eventtype=${type}&eventid=${eventId}`)
  const p = d?.properties ?? {}
  const sev = p.severitydata ?? {}
  const c = d?.geometry?.coordinates
  return [
    `${p.alertlevel ?? "?"} ${p.eventtype ?? type} — ${p.name ?? `event ${eventId}`}`,
    `From ${String(p.fromdate ?? "").slice(0, 10)}${p.todate ? ` to ${String(p.todate).slice(0, 10)}` : ""} · ${p.country ?? "country unknown"}`,
    `Alert score ${p.alertscore ?? "n/a"} · current: ${p.iscurrent ?? "unknown"} · episode ${p.episodeid ?? "n/a"}`,
    Array.isArray(c) ? `Location: ${(c as number[])[1]}, ${(c as number[])[0]}` : "",
    p.description ? `\n${String(p.description).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 600)}` : "",
    Object.keys(sev).length
      ? `\nSeverity:\n${Object.entries(sev)
          .map(([k, v]) => `   ${k}: ${typeof v === "object" ? JSON.stringify(v).slice(0, 140) : v}`)
          .join("\n")}`
      : "",
    reportUrl(p) ? `\nReport: ${reportUrl(p)}` : "",
  ]
    .filter((l) => l !== "")
    .join("\n")
}

export async function typeCatalog(): Promise<string> {
  return [
    "GDACS hazard types:",
    "",
    ...TYPE_CODES.map((code) => `   ${code} — ${EVENT_TYPES[code]}`),
    "",
    `Alert levels: ${ALERT_LEVELS.join(", ")} (Red is most severe)`,
    "",
    "Every tool reads the live event list, so counts change as new alerts are issued.",
  ].join("\n")
}
