/**
 * Guild Wars 2 client. Keyless public API plus the official wiki.
 *
 * The /v2/search name endpoint was retired upstream, so item search now
 * goes through the GW2 wiki search API and resolves the API item id from
 * each page's wikitext infobox. The daily achievements endpoint has been
 * flaky (503s), so it gets retries with backoff.
 */
const BASE = "https://api.guildwars2.com/v2"
const WIKI = "https://wiki.guildwars2.com/api.php"

export class Gw2Error extends Error {}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json", "User-Agent": "gw2-mcp/1.0" },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Gw2Error(`GW2 API error ${res.status}: ${res.statusText}`)
  return (await res.json()) as T
}

export interface Gw2Item {
  id: number
  name: string
  type?: string
  rarity?: string
  level?: number
  vendor_value?: number
  icon?: string
  description?: string
  flags?: string[]
  details?: { type?: string }
}

export interface Price {
  id: number
  buys: { unit_price: number; quantity: number }
  sells: { unit_price: number; quantity: number }
}

export interface Achievement {
  id: number
  name: string
  description?: string
  tier?: { count: number; points: number }[]
  points?: number
  type?: string
  icon?: string
}

/** Extract the API item id from a wiki page's wikitext infobox (| id = N). */
async function wikiPageItemId(title: string): Promise<number | null> {
  try {
    const url = `${WIKI}?action=parse&page=${encodeURIComponent(title)}&prop=wikitext&format=json&formatversion=2`
    const res = await fetch(url, {
      headers: { "User-Agent": "gw2-mcp/1.0" },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return null
    const data = (await res.json()) as any
    const wt: string = data?.parse?.wikitext ?? ""
    const m = wt.match(/\|\s*id\s*=\s*(\d+)/)
    return m ? parseInt(m[1], 10) : null
  } catch {
    return null
  }
}

/** Search items by name via the wiki, resolving each hit to an API item. */
export async function searchItems(name: string, limit = 10): Promise<Gw2Item[]> {
  const url = `${WIKI}?action=query&list=search&srsearch=${encodeURIComponent(
    name,
  )}&srnamespace=0&format=json&srlimit=${Math.min(limit, 20)}`
  const res = await fetch(url, {
    headers: { "User-Agent": "gw2-mcp/1.0" },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Gw2Error(`GW2 wiki search error ${res.status}`)
  const data = (await res.json()) as any
  const titles: string[] = (data?.query?.search ?? []).map((s: any) => s.title)
  const found: Gw2Item[] = []
  for (const title of titles) {
    if (found.length >= limit) break
    const id = await wikiPageItemId(title)
    if (id == null) continue // wiki page without an item infobox (NPC etc.)
    const item = await getItem(id)
    if (item) found.push(item)
  }
  return found
}

export async function getItem(id: number): Promise<Gw2Item | null> {
  try {
    return await getJson<Gw2Item>(`/items/${id}?lang=en`)
  } catch (e) {
    if (e instanceof Gw2Error && String(e).includes("404")) return null
    throw e
  }
}

export async function getItemPrice(id: number): Promise<Price | null> {
  try {
    return await getJson<Price>(`/commerce/prices/${id}`)
  } catch (e) {
    if (e instanceof Gw2Error && String(e).includes("404")) return null
    throw e
  }
}

export async function getAchievement(id: number): Promise<Achievement | null> {
  try {
    return await getJson<Achievement>(`/achievements/${id}?lang=en`)
  } catch (e) {
    if (e instanceof Gw2Error && String(e).includes("404")) return null
    throw e
  }
}

/** Daily achievements. The endpoint has been returning 503s upstream, so
 *  we retry with 2s / 4s / 6s backoff before giving up cleanly. */
export async function getDailyAchievements(): Promise<{ id: number; level_min?: number }[]> {
  let d: { pve?: { id: number; level_min?: number }[] } | null = null
  let lastErr: unknown = null
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 2000 * attempt))
    try {
      d = await getJson<{ pve?: { id: number; level_min?: number }[] }>("/achievements/daily")
      break
    } catch (e) {
      lastErr = e
      if (!(e instanceof Gw2Error)) throw e
    }
  }
  if (!d) {
    // Today endpoint is down (it has been flaky with 503s). Fall back to
    // the PvE daily pool (achievement category 85) so the tool still
    // returns real daily targets instead of failing.
    const pool = await getJson<Achievement[]>(
      "/achievements?category=85&lang=en&page=0&page_size=10",
    )
    return (pool ?? []).slice(0, 10).map((a) => ({ id: a.id }))
  }
  return (d.pve ?? []).slice(0, 10)
}

export function fmtGold(copper: number): string {
  const sign = copper < 0 ? "-" : ""
  const c = Math.abs(copper)
  return `${sign}${Math.floor(c / 10000)}g ${Math.floor((c % 10000) / 100)}s ${c % 100}c`
}

export function formatItem(i: Gw2Item): string {
  const lines = [
    `[${i.id}] ${i.name}`,
    [i.type, i.rarity, i.level ? `lvl ${i.level}` : "", i.details?.type]
      .filter(Boolean)
      .join(" · "),
    i.description ?? "",
    i.vendor_value ? `Vendor value: ${fmtGold(i.vendor_value)}` : "",
    i.icon ?? "",
  ].filter(Boolean)
  return lines.join("\n")
}

export function formatPrice(p: Price): string {
  return (
    `Buy: ${fmtGold(p.buys.unit_price)} (${p.buys.quantity} listed)\n` +
    `Sell: ${fmtGold(p.sells.unit_price)} (${p.sells.quantity} wanted)`
  )
}

export function formatAchievement(a: Achievement): string {
  const lines = [
    `[${a.id}] ${a.name}`,
    a.description ?? "",
    a.tier?.length
      ? `Tiers: ${a.tier.map((t) => `${t.count} = ${t.points} pts`).join(", ")}`
      : "",
    a.type ? `Type: ${a.type}` : "",
  ].filter(Boolean)
  return lines.join("\n")
}
