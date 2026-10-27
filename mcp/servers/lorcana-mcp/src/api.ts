/**
 * Disney Lorcana Cards — keyless public API client.
 */
const BASE = "https://api.lorcast.com"
const SOURCE = "Disney Lorcana Cards"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "lorcana-mcp", accept },
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

function cardLine(c: any): string {
  const stats: string[] = []
  if (c.cost !== undefined && c.cost !== null) stats.push(`cost ${c.cost}`)
  if (c.strength !== undefined) stats.push(`${c.strength} strength`)
  if (c.willpower !== undefined) stats.push(`${c.willpower} willpower`)
  if (c.lore !== undefined) stats.push(`${c.lore} lore`)
  const types = Array.isArray(c.type) ? c.type.join("/") : clean(c.type)
  const set = c.set?.name ? `${clean(c.set.name)} (${clean(c.set.code)})` : "set unknown"
  return [
    `${clean(c.name)}${clean(c.version) ? ` - ${clean(c.version)}` : ""} · ${clean(c.ink) || "?"} · ${types || "?"}${c.rarity ? ` · ${clean(c.rarity)}` : ""}`,
    stats.length ? `  ${stats.join(" · ")}` : "",
    c.text ? `  ${clean(c.text).slice(0, 200)}` : "",
    `  ${set} #${clean(c.collector_number) || "?"}${typeof c.prices?.usd === "number" ? ` · $${c.prices.usd}` : ""}`,
  ].filter(Boolean).join("\n")
}

export async function searchCards(a: { query: string; limit?: number }): Promise<string> {
  const q = clean(a.query)
  if (q.length < 2) throw new SourceError("query must be at least 2 characters")
  const limit = a.limit ?? 10
  if (!Number.isInteger(limit) || limit < 1 || limit > 25) throw new SourceError("limit must be between 1 and 25")
  const d = await getJson(`/v0/cards/search?q=${encodeURIComponent(q)}&limit=${limit}`)
  const rows: any[] = Array.isArray(d?.results) ? d.results : []
  if (!rows.length) return `Lorcast found no card for "${q}".`
  return [
    `${rows.length} card(s) match "${q}":`,
    "",
    ...rows.map(cardLine),
  ].join("\n")
}

export async function cardDetail(a: { cardId: string }): Promise<string> {
  const id = clean(a.cardId)
  if (!/^crd_[A-Za-z0-9]+$/.test(id)) throw new SourceError("cardId must look like crd_<hex>")
  const c = await getJson(`/v0/cards/${encodeURIComponent(id)}`)
  if (!c || !c.name) throw new SourceError(`Lorcast has no card ${id}`)
  const legal = Object.entries(c.legalities ?? {}).filter(([, v]) => v === "legal").map(([k]) => k)
  return [
    `${clean(c.name)}${clean(c.version) ? ` - ${clean(c.version)}` : ""}`,
    `Ink: ${clean(c.ink) || "?"}${Array.isArray(c.inks) && c.inks.length > 1 ? ` (${c.inks.join(" / ")})` : ""} · type: ${Array.isArray(c.type) ? c.type.join("/") : clean(c.type) || "?"}`,
    Array.isArray(c.classifications) && c.classifications.length ? `Classifications: ${c.classifications.join(", ")}` : "",
    `Stats: cost ${c.cost ?? "?"}${c.move_cost !== undefined ? ` · move cost ${c.move_cost}` : ""}${c.strength !== undefined ? ` · ${c.strength}/${c.willpower} strength/willpower` : ""}${c.lore !== undefined ? ` · ${c.lore} lore` : ""}${c.inkwell ? " · inkwell" : ""}`,
    c.text ? `Text: ${clean(c.text)}` : "",
    c.flavor_text ? `Flavour: ${clean(c.flavor_text)}` : "",
    `Rarity: ${clean(c.rarity) || "?"} · set ${clean(c.set?.name) || "?"} (${clean(c.set?.code) || "?"}) #${clean(c.collector_number) || "?"}${c.released_at ? ` · released ${clean(c.released_at)}` : ""}`,
    Array.isArray(c.illustrators) && c.illustrators.length ? `Illustrated by ${c.illustrators.join(", ")}` : "",
    typeof c.prices?.usd === "number" ? `Prices: $${c.prices.usd}${typeof c.prices.usd_foil === "number" ? ` · foil $${c.prices.usd_foil}` : ""}` : "No price published",
    legal.length ? `Legal in: ${legal.join(", ")}` : "",
    c.image_uris?.digital?.normal ? `Image: ${clean(c.image_uris.digital.normal)}` : "",
  ].filter(Boolean).join("\n")
}

export async function listSets(a: { limit?: number }): Promise<string> {
  const limit = a.limit ?? 20
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new SourceError("limit must be between 1 and 50")
  const d = await getJson(`/v0/sets`)
  const rows: any[] = Array.isArray(d?.results) ? d.results : []
  if (!rows.length) throw new SourceError("Lorcast returned no sets")
  return [
    `Lorcana sets (${rows.length} in total, showing ${Math.min(limit, rows.length)}):`,
    "",
    ...rows.slice(0, limit).map((s) => `- ${clean(s.name)} (${clean(s.code)}) · released ${clean(s.released_at) || "?"}${s.prereleased_at ? ` · prerelease ${clean(s.prereleased_at)}` : ""}`),
  ].join("\n")
}
