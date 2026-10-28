/**
 * NASA EONET v3 — Earth Observatory Natural Event Tracker. Keyless.
 * Docs: https://eonet.gsfc.nasa.gov/docs/v3
 */
const BASE = "https://eonet.gsfc.nasa.gov/api/v3"

export class EonetError extends Error {}

async function getJson(path: string, timeoutMs = 25000): Promise<any> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${BASE}${path}`, {
      signal: ctrl.signal,
      headers: { "user-agent": "nasa-eonet-mcp", accept: "application/json" },
    })
    if (res.status === 404) throw new EonetError("EONET has no data for that request")
    if (!res.ok) throw new EonetError(`EONET responded ${res.status}`)
    return await res.json()
  } catch (e) {
    if (e instanceof EonetError) throw e
    if ((e as Error).name === "AbortError") throw new EonetError("EONET request timed out")
    if (e instanceof SyntaxError) throw new EonetError("EONET returned malformed JSON")
    throw new EonetError(`EONET request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

interface Event {
  id: string
  title: string
  description?: string
  closed?: string | null
  categories?: { id: string; title: string }[]
  sources?: { id: string; url: string }[]
  geometry?: { date: string; type: string; coordinates: number[] | number[][] }[]
}

function place(g?: Event["geometry"]): string {
  const last = g?.[g.length - 1]
  if (!last) return "location not published"
  const c = last.coordinates
  if (Array.isArray(c) && typeof c[0] === "number") return `${(c as number[])[1]}, ${(c as number[])[0]}`
  if (Array.isArray(c) && c.length > 0) {
    const first = c[0] as number[]
    const flat = (c as number[][]).flatMap((x) => x)
    const lon = flat.filter((_, i) => i % 2 === 0)
    const lat = flat.filter((_, i) => i % 2 === 1)
    return `polygon ${Math.min(...lat).toFixed(2)}..${Math.max(...lat).toFixed(2)} lat, ${Math.min(...lon).toFixed(2)}..${Math.max(...lon).toFixed(2)} lon (${first ? "area" : "area"})`
  }
  return "location not published"
}

function eventLine(e: Event, i?: number): string {
  const prefix = typeof i === "number" ? `${i + 1}. ` : "• "
  const cats = (e.categories ?? []).map((c) => c.title).join(", ") || "uncategorised"
  const last = e.geometry?.[e.geometry.length - 1]
  return [
    `${prefix}${e.title} (${e.id})`,
    `   ${cats} · last fix ${String(last?.date ?? "").slice(0, 10) || "unknown"} · ${e.closed ? `closed ${String(e.closed).slice(0, 10)}` : "open"}`,
    `   ${place(e.geometry)}`,
  ].join("\n")
}

export async function listEvents(args: {
  days: number
  category?: string
  status?: "open" | "closed" | "all"
  limit: number
}): Promise<string> {
  const params = new URLSearchParams({ days: String(args.days), limit: String(Math.max(args.limit, 1)) })
  if (args.category) params.set("category", args.category)
  if (args.status && args.status !== "all") params.set("status", args.status)
  const d = await getJson(`/events?${params}`)
  const rows: Event[] = d?.events ?? []
  if (rows.length === 0) return `EONET has no events for that filter in the last ${args.days} days.`
  return [
    `NASA EONET events, last ${args.days} days${args.category ? ` (category ${args.category})` : ""}${args.status && args.status !== "all" ? ` (${args.status})` : ""}:`,
    "",
    ...rows.slice(0, args.limit).map((e, i) => eventLine(e, i)),
  ].join("\n")
}

export async function eventDetail(id: string): Promise<string> {
  const clean = id.trim().toUpperCase()
  if (!/^[A-Z]{2}\d+$/.test(clean)) throw new EonetError(`"${id}" is not an EONET id (they look like EONET_1234)`)
  const d = await getJson(`/events/${clean}`)
  const e: Event = d
  const geom = e.geometry ?? []
  return [
    `${e.title} (${e.id})`,
    `Categories: ${(e.categories ?? []).map((c) => `${c.title} [${c.id}]`).join(", ") || "uncategorised"}`,
    `Status: ${e.closed ? `closed ${String(e.closed).slice(0, 10)}` : "open"} · fixes: ${geom.length}`,
    "",
    e.description ? String(e.description).replace(/\s+/g, " ").slice(0, 500) : "No description published.",
    "",
    "Track (newest first):",
    ...geom
      .slice(-8)
      .reverse()
      .map((g) => `   ${String(g.date).slice(0, 16).replace("T", " ")} — ${Array.isArray(g.coordinates[0]) ? "polygon" : `${
        (g.coordinates as number[])[1]}, ${(g.coordinates as number[])[0]}`
      }`),
    "",
    ...(e.sources ?? []).map((s) => `Source: ${s.id} — ${s.url}`),
  ].join("\n")
}

export async function categories(): Promise<string> {
  const d = await getJson("/categories")
  const rows: any[] = d?.categories ?? []
  return [
    `EONET categories (${rows.length}):`,
    "",
    ...rows.map((c) => `   ${c.id} — ${c.title}`),
  ].join("\n")
}

export async function sources(): Promise<string> {
  const d = await getJson("/sources")
  const rows: any[] = d?.sources ?? []
  return [
    `EONET sources (${rows.length}):`,
    "",
    ...rows.map((s) => `   ${s.id} — ${s.title ?? ""} ${s.url ?? ""}`.trim()),
  ].join("\n")
}

export async function eventsOnMap(category: string, limit: number): Promise<string> {
  const d = await getJson(`/events?category=${encodeURIComponent(category.trim())}&status=open&limit=${limit}`)
  const rows: Event[] = d?.events ?? []
  if (rows.length === 0) return `No open ${category} events right now.`
  const coords = rows
    .map((e) => e.geometry?.[e.geometry.length - 1]?.coordinates)
    .filter((c): c is number[] => Array.isArray(c) && typeof c[0] === "number")
  const map = coords.length
    ? `Map: https://www.openstreetmap.org/#map=3/${(coords.reduce((a, c) => a + (c[1] as number), 0) / coords.length).toFixed(2)}/${(
        coords.reduce((a, c) => a + (c[0] as number), 0) / coords.length
      ).toFixed(2)}`
    : "No point geometry to map."
  return [
    `Open ${category} events on Earth right now (${rows.length}):`,
    "",
    ...rows.map((e, i) => eventLine(e, i)),
    "",
    map,
  ].join("\n")
}
