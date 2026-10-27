/**
 * TCGdex API v2 client — the open Pokémon TCG database.
 * Docs: https://www.tcgdex.dev/  (free, no key)
 */

const BASE = "https://api.tcgdex.net/v2/en"

export class TcgError extends Error {}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json", "User-Agent": "pokemon-tcg-mcp/1.0" },
  })
  if (!res.ok) throw new TcgError(`TCGdex API error ${res.status}: ${res.statusText}`)
  return (await res.json()) as T
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CardSummary {
  id: string
  localId: string
  name: string
  image?: string
  category?: string
  rarity?: string
  set?: { id?: string; name?: string }
}

export interface CardDetail {
  id: string
  name: string
  category?: string
  hp?: string
  types?: string[]
  rarity?: string
  illustrator?: string
  abilities?: { name?: string; effect?: string }[]
  attacks?: { name?: string; cost?: string[]; damage?: string; effect?: string }[]
  weakness?: { type?: string; value?: string }[]
  resistances?: { type?: string; value?: string }[]
  retreat?: number
  image?: string
  set?: { id?: string; name?: string }
  variants?: { firstEdition?: boolean; holo?: boolean; reverse?: boolean }
  prices?: Record<string, Record<string, number>>
}

export interface SetSummary {
  id: string
  name: string
  releaseDate?: string
  cardCount?: number
  logo?: string
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export async function searchCards(
  name: string,
  rarity?: string,
  limit = 12
): Promise<CardSummary[]> {
  const rarityParam = rarity ? `&rarity=${encodeURIComponent(rarity)}` : ""
  const data = await getJson<CardSummary[]>(
    `/cards?name=${encodeURIComponent(name)}${rarityParam}`
  )
  return (data ?? []).slice(0, limit)
}

export async function getCard(id: string): Promise<CardDetail | null> {
  const data = await getJson<CardDetail>(`/cards/${id}`)
  return data && data.id ? data : null
}

export async function listSets(): Promise<SetSummary[]> {
  const data = await getJson<SetSummary[]>("/sets")
  return (data ?? []).sort(
    (a, b) => (b.releaseDate ?? "").localeCompare(a.releaseDate ?? "")
  )
}

export async function getSet(id: string): Promise<SetSummary & { cards: CardSummary[] } | null> {
  const data = await getJson<any>(`/sets/${id}`)
  if (!data || !data.id) return null
  return {
    id: data.id,
    name: data.name ?? "?",
    releaseDate: data.releaseDate,
    cardCount: data.cardCount?.total ?? data.cards?.length,
    logo: data.logo,
    cards: (data.cards ?? []).map((c: any) => ({
      id: c.id,
      localId: c.localId,
      name: c.name,
      category: c.category,
      rarity: c.rarity,
      image: c.image,
    })),
  }
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function formatCardSummary(c: CardSummary): string {
  return (
    `[${c.id}] ${c.name}` +
    (c.rarity ? ` (${c.rarity})` : "") +
    (c.category ? ` — ${c.category}` : "") +
    (c.set?.name ? `\n   Set: ${c.set.name}` : "") +
    (c.image ? `\n   ${c.image}` : "")
  )
}

export function formatCardDetail(c: CardDetail): string {
  const lines = [
    `[${c.id}] ${c.name}${c.rarity ? ` (${c.rarity})` : ""}`,
    `${c.category ?? "?"}${c.hp ? ` | HP ${c.hp}` : ""}` +
      (c.types?.length ? ` | Types: ${c.types.join("/")}` : "") +
      (c.retreat ? ` | Retreat: ${c.retreat}` : ""),
  ]
  for (const a of c.abilities ?? []) {
    lines.push(`\nAbility: ${a.name}\n${a.effect ?? ""}`)
  }
  for (const atk of c.attacks ?? []) {
    lines.push(
      `\nAttack: ${atk.name}${atk.damage ? ` (${atk.damage})` : ""}` +
        (atk.cost?.length ? ` [${atk.cost.join(" ")}]` : "") +
        (atk.effect ? `\n${atk.effect}` : "")
    )
  }
  if (c.weakness?.length) {
    lines.push(`Weakness: ${c.weakness.map((w) => `${w.type} ${w.value ?? ""}`.trim()).join(", ")}`)
  }
  if (c.prices) {
    const entries = Object.entries(c.prices)
      .map(([variant, p]) => {
        const low = p.low ? `low $${p.low}` : ""
        const mid = p.average ? `avg $${p.average}` : ""
        const high = p.high ? `high $${p.high}` : ""
        return `${variant}: ${[low, mid, high].filter(Boolean).join(" / ")}`
      })
      .join(", ")
    if (entries) lines.push(`Market prices: ${entries}`)
  }
  if (c.illustrator) lines.push(`Illustrator: ${c.illustrator}`)
  if (c.set?.name) lines.push(`Set: ${c.set.name}`)
  if (c.image) lines.push(`\n${c.image}`)
  return lines.join("\n")
}

export function formatSet(s: SetSummary): string {
  return (
    `[${s.id}] ${s.name}` +
    (s.releaseDate ? ` — ${s.releaseDate}` : "") +
    (s.cardCount ? ` (${s.cardCount} cards)` : "")
  )
}
