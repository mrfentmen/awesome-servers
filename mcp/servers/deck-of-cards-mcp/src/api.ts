const BASE = "https://deckofcardsapi.com/api"
const UA = "mrfentmen-deck-of-cards-mcp/1.0 (https://github.com/mrfentmen)"
export class CardsError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new CardsError(`Deck of Cards returned HTTP ${res.status}`)
  return (await res.json()) as T
}

export async function newDeck(args: { decks?: number }): Promise<string> {
  const decks = Math.min(Math.max(Number(args.decks ?? 1), 1), 8)
  const d = await get<any>(`${BASE}/deck/new/shuffle/?deck_count=${decks}`)
  if (!d?.success) throw new CardsError("Could not create a deck")
  return `New shuffled deck:\n  Deck ID: ${d?.deck_id}\n  Cards remaining: ${d?.remaining ?? decks * 52}\n  Shuffled: ${d?.shuffled ? "yes" : "no"}`
}

export async function draw(args: { deckId?: string; count?: number }): Promise<string> {
  const deckId = (args.deckId ?? "").trim()
  if (!deckId) throw new CardsError("Provide a deck ID")
  const count = Math.min(Math.max(Number(args.count ?? 1), 1), 52)
  const d = await get<any>(`${BASE}/deck/${encodeURIComponent(deckId)}/draw/?count=${count}`)
  if (!d?.success) throw new CardsError(d?.error ?? "Could not draw cards")
  const cards = (d?.cards ?? []) as any[]
  return `Drew ${cards.length} card(s) from deck ${deckId} (${d?.remaining} left):\n` + cards.map((c, i) =>
    `${i + 1}. ${c?.value ?? "?"} of ${c?.suit ?? "?"}`
  ).join("\n")
}

// ---- muxA tools:
// The existing tools create a full deck and draw from it. These build a deck
// from exactly the named cards and put an already dealt deck back together.

export interface BuildDeckArgs {
  cards: string
  shuffle?: boolean
  deckCount?: number
}

export async function reshuffle(args: { deckId?: string }): Promise<string> {
  const deckId = (args.deckId ?? "").trim()
  if (!deckId) throw new CardsError("Provide a deck ID")
  const d = await get<any>(`${BASE}/deck/${encodeURIComponent(deckId)}/shuffle/?remaining=true`)
  if (!d?.deck_id) throw new CardsError("The deck service returned no deck id")
  return `Deck ${d.deck_id} shuffled:\n  Cards remaining: ${d.remaining ?? "?"}\n  Shuffled: ${d.shuffled ? "yes" : "no"}`
}
