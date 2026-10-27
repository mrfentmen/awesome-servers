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
    signal: AbortSignal.timeout(30000),
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
  prices?: { usd?: string | null; usd_foil?: string | null; eur?: string | null; tix?: string | null }
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

/** A single random card — handy for deck ideas and discovery. */
export async function getRandomCard(): Promise<Card> {
  return mapCard(await getJson<any>(`/cards/random`))
}

/** Cards from one set, e.g. 'dmu'. Scryfall's set: syntax, newest first is not guaranteed. */
export async function searchSet(setCode: string, pageSize = 20): Promise<{ total: number; cards: Card[] }> {
  const code = setCode.trim().toLowerCase()
  const data = await getJson<{ data?: any[]; total_cards?: number }>(
    `/cards/search?q=set%3A${encodeURIComponent(code)}&order=name&page_size=${Math.min(Math.max(pageSize, 1), 40)}`
  )
  return { total: data.total_cards ?? (data.data ?? []).length, cards: (data.data ?? []).map(mapCard) }
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
    image_uris: c.image_uris ?? c.card_faces?.[0]?.image_uris,
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

/** Price breakdown across every market Scryfall tracks, plus the cheapest printing note. */
export function formatPrices(c: Card): string {
  const p = c.prices ?? {}
  const lines = [
    `${c.name} — ${c.set_name ?? c.set ?? "?"} (${c.set ?? "?"}) ${c.rarity ?? ""}${c.collector_number ? ` #${c.collector_number}` : ""}`.trim(),
    `TCGplayer (USD, non-foil): ${fmtPrice(p.usd)}`,
    `TCGplayer (USD, foil):     ${fmtPrice(p.usd_foil)}`,
    `Cardmarket (EUR):          ${p.eur ? `€${p.eur}` : "—"}`,
    `MTGO (tix):                ${p.tix ? `${p.tix} tix` : "—"}`,
  ]
  if (!p.usd && !p.usd_foil && !p.eur && !p.tix) {
    lines.push("No market prices published for this printing yet.")
  }
  return lines.join("\n")
}
// ---- batch-5 tools: bulk collection lookup, exact printing, mana symbols, name completion (2026-09-27) ----

/**
 * The collection endpoint is the only POST in the Scryfall API, so it needs its
 * own request helper. It keeps the same inter-request gap as getJson so the
 * server's rate limit is respected either way.
 */
async function postJson<T>(path: string, body: unknown): Promise<T> {
  const now = Date.now()
  const gap = 150 - (now - lastRequest)
  if (gap > 0) await new Promise((r) => setTimeout(r, gap))
  lastRequest = Date.now()
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", "User-Agent": "scryfall-mcp/1.0" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new ScryfallError(`Scryfall error ${res.status}: ${res.statusText}`)
  return (await res.json()) as T
}

interface CollectionReply {
  data?: unknown[]
  not_found?: unknown[]
}

/** One line per card, for lists: name, set, number, rarity and price. */
const shortCard = (c: Card) =>
  `${c.name}${c.mana_cost ? ` ${c.mana_cost}` : ""} — ${c.set_name ?? c.set ?? "?"} (${c.set ?? "?"}) ${c.rarity ?? ""}${c.collector_number ? ` #${c.collector_number}` : ""} — ${fmtPrice(c.prices?.usd)}`

/**
 * Resolves a whole decklist or want-list in one request, up to Scryfall's limit
 * of 75 identifiers, and names the ones that did not resolve instead of
 * silently dropping them.
 */
export async function cardsByCollection(args: { names: string[] }): Promise<string> {
  const names = (args.names ?? []).map((n) => String(n).trim()).filter(Boolean)
  if (!names.length) throw new ScryfallError("Give at least one card name.")
  if (names.length > 75) throw new ScryfallError(`Scryfall resolves at most 75 cards per request; ${names.length} were given. Send them in batches.`)
  const reply = await postJson<CollectionReply>("/cards/collection", { identifiers: names.map((name) => ({ name })) })
  const found = (reply.data ?? []).map((raw) => mapCard(raw))
  const missing = (reply.not_found ?? []).map((raw) => {
    const row = raw as { name?: string; set?: string; collector_number?: string }
    return row.name ?? `${row.set ?? "?"} #${row.collector_number ?? "?"}`
  })
  const usd = found
    .map((c) => Number(c.prices?.usd ?? ""))
    .filter((n) => Number.isFinite(n) && n > 0)
  return [
    `Collection lookup: ${names.length} name(s) asked, ${found.length} resolved, ${missing.length} not found`,
    usd.length ? `  total TCGplayer value of the resolved cards: $${usd.reduce((sum, n) => sum + n, 0).toFixed(2)} (average $${(usd.reduce((sum, n) => sum + n, 0) / usd.length).toFixed(2)})` : "  none of the resolved cards has a published price",
    "",
    found.length ? "Resolved:" : "",
    ...found.map((c, i) => `${i + 1}. ${shortCard(c)}`),
    missing.length ? "\nNot found (check the spelling, or use card_autocomplete first):" : "",
    ...missing.map((name) => `  - ${name}`),
  ].filter((line) => line !== "").join("\n")
}

/**
 * One exact printing by set code and collector number. Search cannot do this
 * reliably: a set search returns every printing, and the number identifies the
 * one card.
 */
export async function cardBySetNumber(args: { set: string; number: string }): Promise<string> {
  const set = (args.set ?? "").trim().toLowerCase()
  const number = (args.number ?? "").trim()
  if (!/^[a-z0-9]{2,6}$/.test(set)) throw new ScryfallError(`"${args.set}" is not a set code, e.g. 'lea' or 'mh3'.`)
  if (!number) throw new ScryfallError("Give a collector number, e.g. '233' or '233a'.")
  const raw = await getJson<unknown>(`/cards/${encodeURIComponent(set)}/${encodeURIComponent(number)}`)
  return formatCard(mapCard(raw))
}

interface SymbolRaw {
  symbol?: string
  english?: string
  mana_value?: number
  represents_mana?: boolean
  appears_in_mana_costs?: boolean
  hybrid?: boolean
  phyrexian?: boolean
  svg_uri?: string
}

/**
 * Scryfall's symbology: every mana and counter symbol with its meaning, mana
 * value and the SVG file, which is what a card renderer or rules explainer needs.
 */
export async function manaSymbols(args: { query?: string; limit?: number }): Promise<string> {
  const query = (args.query ?? "").trim().toLowerCase()
  const limit = Math.min(Math.max(Math.trunc(args.limit ?? 40), 1), 200)
  const reply = await getJson<{ data?: SymbolRaw[] }>("/symbology")
  const all = reply.data ?? []
  // A symbol is searched by its name, its meaning and its own flags, so
  // "phyrexian" or "hybrid" find their set instead of coming back empty.
  const haystack = (s: SymbolRaw) =>
    [s.symbol, s.english, s.represents_mana ? "mana" : "", s.hybrid ? "hybrid" : "", s.phyrexian ? "phyrexian" : "", s.appears_in_mana_costs ? "cost" : ""]
      .join(" ")
      .toLowerCase()
  const rows = query ? all.filter((s) => haystack(s).includes(query)) : all
  if (!rows.length) throw new ScryfallError(`No mana symbol matches "${args.query}".`)
  return [
    `Mana symbols${query ? ` matching "${args.query}"` : ""}: ${rows.length} of ${all.length}`,
    "",
    ...rows.slice(0, limit).map((s) => {
      const tags = [s.represents_mana ? "mana" : "not mana", s.hybrid ? "hybrid" : "", s.phyrexian ? "phyrexian" : ""].filter(Boolean).join(", ")
      return `  ${(s.symbol ?? "?").padEnd(6)} value ${s.mana_value ?? 0} — ${s.english ?? "no meaning published"} (${tags})\n    ${s.svg_uri ?? "no svg"}`.trimEnd()
    }),
    rows.length > limit ? `\nShowing ${limit} of ${rows.length}; raise limit for the rest.` : "",
  ].filter((line) => line !== "").join("\n")
}

/**
 * Name completion, the cheapest way to turn a half-remembered or misspelled
 * card name into one that a search will actually match.
 */
export async function cardAutocomplete(args: { query: string }): Promise<string> {
  const query = (args.query ?? "").trim()
  if (query.length < 2) throw new ScryfallError("Give at least two characters of a card name.")
  const reply = await getJson<{ total_values?: number; data?: string[] }>(`/cards/autocomplete?q=${encodeURIComponent(query)}`)
  const names = reply.data ?? []
  if (!names.length) return `No card name starts like "${query}".`
  return [
    `Card names matching "${query}": ${reply.total_values ?? names.length}`,
    "",
    ...names.map((name) => `  ${name}`),
    "",
    "Pass one of these to search_cards or cards_by_collection rather than the partial name.",
  ].join("\n")
}
