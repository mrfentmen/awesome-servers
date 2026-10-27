/**
 * Poker Hands — keyless public API client.
 */
const BASE = "https://example.invalid"
const SOURCE = "Poker Hands"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "poker-mcp", accept },
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

const RANKS = "23456789TJQKA"
const SUITS = "shdc"

type Card = { rank: number; suit: string; text: string }

function parseCard(text: string): Card {
  const t = text.trim()
  if (t.length !== 2) throw new SourceError(`"${text}" is not a card like As or Td`)
  const r = RANKS.indexOf(t[0].toUpperCase())
  const s = t[1].toLowerCase()
  if (r < 0) throw new SourceError(`"${t[0]}" is not a rank (2-9, T, J, Q, K, A)`)
  if (!SUITS.includes(s)) throw new SourceError(`"${t[1]}" is not a suit (s, h, d, c)`)
  return { rank: r, suit: s, text: `${RANKS[r]}${s}` }
}

function parseHand(cards: string[]): Card[] {
  const parsed = cards.map(parseCard)
  if (new Set(parsed.map((c) => c.text)).size !== parsed.length) throw new SourceError("the same card appears twice")
  return parsed
}

const CATEGORIES = ["High card", "One pair", "Two pair", "Three of a kind", "Straight", "Flush", "Full house", "Four of a kind", "Straight flush"]

type Score = { category: number; tiebreak: number[] }

function score5(cards: Card[]): Score {
  const ranks = cards.map((c) => c.rank).sort((a, b) => b - a)
  const counts = new Map<number, number>()
  for (const r of ranks) counts.set(r, (counts.get(r) ?? 0) + 1)
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])
  const flush = cards.every((c) => c.suit === cards[0].suit)
  const unique = [...new Set(ranks)]
  let straight = false
  if (unique.length === 5) {
    if (unique[0] - unique[4] === 4) straight = true
    if (unique[0] === 12 && unique[1] === 3 && unique[2] === 2 && unique[3] === 1 && unique[4] === 0) {
      straight = true
      ranks.splice(0, 5, 3, 2, 1, 0, -1)
    }
  }
  if (straight && flush) return { category: 8, tiebreak: [ranks[0]] }
  if (groups[0][1] === 4) return { category: 7, tiebreak: [groups[0][0], groups[1][0]] }
  if (groups[0][1] === 3 && groups[1][1] === 2) return { category: 6, tiebreak: [groups[0][0], groups[1][0]] }
  if (flush) return { category: 5, tiebreak: ranks }
  if (straight) return { category: 4, tiebreak: [ranks[0]] }
  if (groups[0][1] === 3) return { category: 3, tiebreak: [groups[0][0], ...groups.slice(1).map((g) => g[0])] }
  if (groups[0][1] === 2 && groups[1][1] === 2) return { category: 2, tiebreak: [groups[0][0], groups[1][0], groups[2][0]] }
  if (groups[0][1] === 2) return { category: 1, tiebreak: [groups[0][0], ...groups.slice(1).map((g) => g[0])] }
  return { category: 0, tiebreak: ranks }
}

function compare(a: Score, b: Score): number {
  if (a.category !== b.category) return a.category - b.category
  for (let i = 0; i < Math.max(a.tiebreak.length, b.tiebreak.length); i++) {
    const d = (a.tiebreak[i] ?? 0) - (b.tiebreak[i] ?? 0)
    if (d !== 0) return d
  }
  return 0
}

const describe = (s: Score): string => {
  const names = ["high card", "one pair", "two pair", "three of a kind", "straight", "flush", "full house", "four of a kind", "straight flush"]
  return `${names[s.category]}${s.tiebreak.length ? ` (${s.tiebreak.map((r) => RANKS[r] ?? "5").join(", ")})` : ""}`
}

export async function evaluateHand(a: { cards: string[] }): Promise<string> {
  const hand = parseHand(a.cards)
  const s = score5(hand)
  return [
    `Hand: ${hand.map((c) => c.text).join(" ")}`,
    `Category: ${CATEGORIES[s.category]}`,
    `Tiebreak ranks: ${s.tiebreak.map((r) => RANKS[r] ?? "5").join(", ")}`,
    `Score: ${describe(s)}`,
  ].join("\n")
}

export async function compareHands(a: { first: string[]; second: string[] }): Promise<string> {
  const x = score5(parseHand(a.first))
  const y = score5(parseHand(a.second))
  const d = compare(x, y)
  return [
    `First: ${describe(x)}`,
    `Second: ${describe(y)}`,
    d > 0 ? "Winner: first hand" : d < 0 ? "Winner: second hand" : "Result: split pot",
  ].join("\n")
}

const COMBOS: number[][] = (() => {
  const out: number[][] = []
  for (let a = 0; a < 3; a++) for (let b = a + 1; b < 4; b++) for (let c = b + 1; c < 5; c++)
    for (let d = c + 1; d < 6; d++) for (let e = d + 1; e < 7; e++) out.push([a, b, c, d, e])
  return out
})()

export async function bestHandOfSeven(a: { cards: string[] }): Promise<string> {
  const cards = parseHand(a.cards)
  let best: { score: Score; hand: Card[] } | null = null
  for (const idx of COMBOS) {
    const hand = idx.map((i) => cards[i])
    const s = score5(hand)
    if (!best || compare(s, best.score) > 0) best = { score: s, hand }
  }
  if (!best) throw new SourceError("could not evaluate the cards")
  return [
    `Best five: ${best.hand.map((c) => c.text).join(" ")}`,
    `Result: ${describe(best.score)}`,
    `Full seven: ${cards.map((c) => c.text).join(" ")}`,
  ].join("\n")
}
