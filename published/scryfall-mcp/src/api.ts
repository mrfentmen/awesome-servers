/**
 * Scryfall (Magic cards) — keyless public API client.
 */
const BASE = "https://api.scryfall.com"
const SOURCE = "Scryfall (Magic cards)"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "scryfall-mcp", accept },
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

function manaCost(card: any): string {
  return clean(card.mana_cost) || clean(card.card_faces?.[0]?.mana_cost) || "no mana cost"
}

function priceLine(card: any): string {
  const p = card.prices ?? {}
  const bits = [p.usd ? `$${p.usd}` : "", p.usd_foil ? `foil $${p.usd_foil}` : "", p.eur ? `€${p.eur}` : ""].filter(Boolean)
  return bits.length ? `Prices: ${bits.join(" · ")}` : "No price published"
}

export async function searchCards(a: { query: string; limit?: number }): Promise<string> {
  const q = clean(a.query)
  if (q.length < 2) throw new SourceError("query must be at least 2 characters")
  const limit = a.limit ?? 10
  if (!Number.isInteger(limit) || limit < 1 || limit > 25) throw new SourceError("limit must be between 1 and 25")
  const d = await getJson(`/cards/search?q=${encodeURIComponent(q)}&page=1`)
  if (d?.object === "error") return `Scryfall rejected the query: ${clean(d.details) || "no detail given"}`
  const rows: any[] = d?.data ?? []
  if (!rows.length) return `Scryfall found no card for "${q}".`
  return [
    `Scryfall: ${d.total_cards ?? rows.length} cards match "${q}"${d.has_more ? " (more pages available)" : ""}, showing ${Math.min(limit, rows.length)}:`,
    "",
    ...rows.slice(0, limit).map((c) => [
      `${clean(c.name)} - ${manaCost(c)} (${clean(c.type_line)})`,
      `  ${clean(c.set_name)} · ${clean(c.rarity)}${c.power ? ` · ${clean(c.power)}/${clean(c.toughness)}` : ""}${c.oracle_text ? ` · ${clean(c.oracle_text).slice(0, 140)}` : ""}`,
      `  ${priceLine(c)}`,
    ].join("\n")),
  ].join("\n")
}

export async function cardByName(a: { name: string }): Promise<string> {
  const name = clean(a.name)
  if (name.length < 2) throw new SourceError("name must be at least 2 characters")
  const d = await getJson(`/cards/named?fuzzy=${encodeURIComponent(name)}`)
  if (d?.object === "error") return `Scryfall has no card called "${name}": ${clean(d.details) || "no match"}`
  const legal = Object.entries(d.legalities ?? {}).filter(([, v]) => v === "legal").map(([k]) => k)
  const banned = Object.entries(d.legalities ?? {}).filter(([, v]) => v === "banned").map(([k]) => k)
  return [
    `${clean(d.name)} - ${manaCost(d)} (${clean(d.type_line)})`,
    d.oracle_text ? `Text: ${clean(d.oracle_text)}` : "",
    d.flavor_text ? `Flavour: ${clean(d.flavor_text)}` : "",
    `${clean(d.set_name)} (${clean(d.set).toUpperCase()}) · ${clean(d.rarity)}${d.collector_number ? ` · #${clean(d.collector_number)}` : ""}`,
    d.power ? `Stats: ${clean(d.power)}/${clean(d.toughness)}${d.loyalty ? ` · loyalty ${clean(d.loyalty)}` : ""}` : "",
    d.artist ? `Illustrated by ${clean(d.artist)}` : "",
    priceLine(d),
    legal.length ? `Legal in: ${legal.join(", ")}` : "",
    banned.length ? `Banned in: ${banned.join(", ")}` : "",
    clean(d.scryfall_uri) ? `Card: ${clean(d.scryfall_uri)}` : "",
  ].filter(Boolean).join("\n")
}
