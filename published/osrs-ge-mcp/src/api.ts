/**
 * OSRS Grand Exchange — keyless public API client.
 */
const BASE = "https://prices.runescape.wiki/api/v1/osrs"
const SOURCE = "OSRS Grand Exchange"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "osrs-ge-mcp", accept },
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

export async function getJson(path: string, accept = "application/json", timeoutMs = 25000): Promise<any> {
  const res = await request(path, accept, timeoutMs)
  const body = await res.text()
  try {
    return JSON.parse(body)
  } catch {
    throw new SourceError(`${SOURCE} returned malformed JSON`)
  }
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

type ItemDef = {
  id: number
  name: string
  members?: boolean
  limit?: number
  value?: number
  lowalch?: number
  highalch?: number
  examine?: string
}

type PriceRow = { high?: number; highTime?: number; low?: number; lowTime?: number }

// The mapping and the latest-price tables are the same for every call and the
// wiki asks clients to be polite, so keep them for an hour.
let mappingCache: { at: number; rows: ItemDef[] } | null = null
let latestCache: { at: number; data: Record<string, PriceRow> } | null = null

async function loadMapping(): Promise<ItemDef[]> {
  if (mappingCache && Date.now() - mappingCache.at < 3600000) return mappingCache.rows
  const rows = await getJson("/mapping", "application/json", 30000)
  if (!Array.isArray(rows) || !rows.length) throw new SourceError("the wiki price API returned no item mapping")
  mappingCache = { at: Date.now(), rows }
  return rows
}

async function loadLatest(): Promise<Record<string, PriceRow>> {
  if (latestCache && Date.now() - latestCache.at < 300000) return latestCache.data
  const body = await getJson("/latest", "application/json", 30000)
  const data = body?.data
  if (!data || typeof data !== "object") throw new SourceError("the wiki price API returned no latest prices")
  latestCache = { at: Date.now(), data }
  return data
}

function gp(n: unknown): string {
  const v = Number(n)
  return Number.isFinite(v) && v > 0 ? `${v.toLocaleString("en-US")} gp` : "n/a"
}

function resolveItem(query: string | number, rows: ItemDef[]): ItemDef {
  const q = clean(query)
  if (/^[0-9]+$/.test(q)) {
    const byId = rows.find((r) => Number(r.id) === Number(q))
    if (byId) return byId
    throw new SourceError(`no OSRS item has id ${q}`)
  }
  if (q.length < 2) throw new SourceError("item name must be at least 2 characters")
  const lower = q.toLowerCase()
  const exact = rows.find((r) => clean(r.name).toLowerCase() === lower)
  if (exact) return exact
  const match = rows.find((r) => clean(r.name).toLowerCase().includes(lower))
  if (match) return match
  throw new SourceError(`no OSRS item matches "${q}"`)
}

function fmtAge(ts: unknown): string {
  const n = Number(ts)
  if (!Number.isFinite(n) || n <= 0) return ""
  const mins = Math.round((Date.now() / 1000 - n) / 60)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 48) return `${hours} h ago`
  return `${Math.round(hours / 24)} d ago`
}

export async function itemSearch(a: { query: string; limit?: number }): Promise<string> {
  const limit = clampLimit(a.limit, 10, 30)
  const q = clean(a.query).toLowerCase()
  if (q.length < 2) throw new SourceError("query must be at least 2 characters")
  const rows = await loadMapping()
  const hits = rows.filter((r) => clean(r.name).toLowerCase().includes(q))
  if (!hits.length) throw new SourceError(`no OSRS item matches "${a.query}"`)
  const shown = hits.slice(0, limit)
  const latest = await loadLatest()
  return [
    `${hits.length} item(s) match "${clean(a.query)}" (showing ${shown.length}):`,
    "",
    "   id    name                              access   limit   latest prices",
    ...shown.map((r) => {
      const l = latest[String(r.id)] ?? {}
      const price = l.high || l.low ? `buy ${gp(l.high)} · sell ${gp(l.low)}` : "no recent trades"
      return `${String(r.id).padStart(6)}  ${clean(r.name).slice(0, 33).padEnd(34)} ${(r.members ? "members" : "free").padEnd(8)} ${String(r.limit ?? "?").padStart(5)}   ${price}`
    }),
  ].join("\n")
}

export async function itemPrice(a: { item: string | number }): Promise<string> {
  const rows = await loadMapping()
  const item = resolveItem(a.item, rows)
  const [latest, fiveMin] = await Promise.all([loadLatest(), getJson("/5m", "application/json", 30000)])
  const l = latest[String(item.id)] ?? {}
  const m = fiveMin?.data?.[String(item.id)] ?? {}
  const spread = Number(l.high) && Number(l.low) ? Number(l.high) - Number(l.low) : 0
  return [
    `${clean(item.name)} (item ${item.id})${item.members ? " · members only" : " · free to play"}`,
    "",
    ...[
      bullet("instant buy", gp(l.high)),
      bullet("instant sell", gp(l.low)),
      bullet("spread", spread ? gp(spread) : ""),
      bullet("buy last traded", fmtAge(l.highTime)),
      bullet("sell last traded", fmtAge(l.lowTime)),
      bullet("5 min average buy", gp(m.avgHighPrice)),
      bullet("5 min average sell", gp(m.avgLowPrice)),
      bullet("5 min buy volume", m.highPriceVolume),
      bullet("5 min sell volume", m.lowPriceVolume),
      bullet("store value", gp(item.value)),
      bullet("buy limit", item.limit),
      bullet("alchemy", item.highalch ? `${gp(item.highalch)} high / ${gp(item.lowalch)} low` : ""),
    ].filter(Boolean),
    "",
    clean(item.examine),
  ].join("\n")
}

export async function priceHistory(a: { item: string | number; timestep?: string; limit?: number }): Promise<string> {
  const limit = clampLimit(a.limit, 14, 60)
  const timestep = clean(a.timestep) || "24h"
  if (!["5m", "1h", "6h", "24h"].includes(timestep)) throw new SourceError("timestep must be 5m, 1h, 6h or 24h")
  const rows = await loadMapping()
  const item = resolveItem(a.item, rows)
  const body = await getJson(`/timeseries?timestep=${timestep}&id=${item.id}`, "application/json", 30000)
  const points: any[] = Array.isArray(body?.data) ? body.data : []
  if (!points.length) throw new SourceError(`the wiki has no ${timestep} history for ${clean(item.name)}`)
  const recent = points.slice(-limit)
  return [
    `${clean(item.name)} (item ${item.id}) — ${timestep} averages, newest ${recent.length} of ${points.length} points:`,
    "",
    "time (UTC)           avg buy        avg sell       buy vol   sell vol",
    ...recent.map((p: any) => {
      const when = new Date(Number(p.timestamp) * 1000).toISOString().slice(0, 16).replace("T", " ")
      return [
        when.padEnd(20),
        gp(p.avgHighPrice).padStart(12),
        gp(p.avgLowPrice).padStart(13),
        String(p.highPriceVolume ?? 0).padStart(10),
        String(p.lowPriceVolume ?? 0).padStart(10),
      ].join(" ")
    }),
  ].join("\n")
}
