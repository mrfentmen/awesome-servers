/**
 * Scryfall client — Magic: The Gathering card database.
 * Docs: https://scryfall.com/docs/api — keyless, ~10 req/s.
 * We keep a small inter-request gap to stay comfortably under the limit.
 */
const BASE = "https://api.scryfall.com"

export class ScryfallError extends Error {}

let lastRequest = 0
async function getJson<T>(path: string): Promise<T> {
  const now = Date.now()
  const gap = 150 - (now - lastRequest)
  if (gap > 0) await new Promise((r) => setTimeout(r, gap))
  lastRequest = Date.now()
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json", "User-Agent": "scryfall-mcp/1.0" },
  })
  if (!res.ok) throw new ScryfallError(`Scryfall error ${res.status}: ${res.statusText}`)
  return (await res.json()) as T
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Card {
  id: string
  oracle_id: string
  name: string
  mana_cost?: string
  cmc?: number
  type_line?: string
  oracle_text?: string
  flavor_text?: string
  rarity?: string
  set?: string
  set_name?: string
  collector_number?: string
  prices?: { usd?: string | null; usd_foil?: string | null; eur?: string | null }
  image_uris?: { normal?: string; png?: string }
  rulings_uri?: string
  colors?: string[]
  legalities?: Record<string, string>
  keywords?: string[]
  power?: string
  toughness?: string
  loyalty?: string
}

export interface Ruling {
  oracle_id: string
  source: string
  published_at: string
  comment: string
}

export interface SetInfo {
  code: string
  name: string
  released_at?: string
  card_count?: number
  set_type?: string
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export async function searchCards(query: string, pageSize = 8): Promise<Card[]> {
  const data = await getJson<{ data?: any[]; has_more?: boolean }>(
    `/cards/search?q=${encodeURIComponent(query)}&page_size=${pageSize}`
  )
  return (data.data ?? []).map(mapCard)
}

export async function getCardByFuzzyName(name: string): Promise<Card | null> {
  try {
    const c = await getJson<any>(`/cards/named?fuzzy=${encodeURIComponent(name)}`)
    return mapCard(c)
  } catch (e) {
    if (e instanceof ScryfallError && e.message.includes("404")) return null
    throw e
  }
}

export async function getCardRulings(cardId: string): Promise<Ruling[]> {
  const data = await getJson<{ data?: any[] }>(`/cards/${cardId}/rulings`)
  return (data.data ?? []).map((r) => ({
    oracle_id: r.oracle_id ?? "",
    source: r.source ?? "",
    published_at: r.published_at ?? "",
    comment: r.comment ?? "",
  }))
}

export async function getSets(): Promise<SetInfo[]> {
  const data = await getJson<{ data?: any[] }>(`/sets`)
  return (data.data ?? [])
    .slice(0, 40)
    .map((s) => ({
      code: s.code ?? "",
      name: s.name ?? "?",
      released_at: s.released_at,
      card_count: s.card_count,
      set_type: s.set_type,
    }))
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

function mapCard(c: any): Card {
  return {
    id: c.id,
    oracle_id: c.oracle_id,
    name: c.name ?? "?",
    mana_cost: c.mana_cost,
    cmc: c.cmc,
    type_line: c.type_line,
    oracle_text: c.oracle_text,
    flavor_text: c.flavor_text,
    rarity: c.rarity,
    set: c.set,
    set_name: c.set_name,
    collector_number: c.collector_number,
    prices: c.prices,
    image_uris: c.image_uris,
    rulings_uri: c.rulings_uri,
    colors: c.colors,
    legalities: c.legalities,
    keywords: c.keywords,
    power: c.power,
    toughness: c.toughness,
    loyalty: c.loyalty,
  }
}

export function fmtPrice(usd?: string | null): string {
  if (!usd) return "—"
  return `$${usd}`
}

export function formatCard(c: Card, index?: number): string {
  const head = `${index !== undefined ? `${index + 1}. ` : ""}${c.name}${c.mana_cost ? ` ${c.mana_cost}` : ""}`
  const stats = [c.power && c.toughness ? `${c.power}/${c.toughness}` : "", c.loyalty ? `Loyalty ${c.loyalty}` : ""]
    .filter(Boolean)
    .join(" · ")
  const lines = [
    head,
    c.type_line ?? "",
    c.oracle_text ?? "",
    c.flavor_text ? `*${c.flavor_text}*` : "",
    stats,
    `${c.set_name ?? c.set ?? ""} ${c.rarity ?? ""}${c.collector_number ? ` #${c.collector_number}` : ""}`,
    `Price: ${fmtPrice(c.prices?.usd)}${c.prices?.usd_foil ? ` / foil ${fmtPrice(c.prices.usd_foil)}` : ""}`,
  ].filter(Boolean)
  if (c.image_uris?.normal) lines.push(c.image_uris.normal)
  return lines.join("\n")
}

export function formatRuling(r: Ruling, i: number): string {
  return `${i + 1}. (${r.source}${r.published_at ? `, ${r.published_at}` : ""}) ${r.comment}`
}
