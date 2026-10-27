const BASE = "https://deckofcardsapi.com/api";
const UA = "mrfentmen-deck-of-cards-mcp/1.0 (https://github.com/mrfentmen)";
export class CardsError extends Error {
}
async function get(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new CardsError(`Deck of Cards returned HTTP ${res.status}`);
    return (await res.json());
}
export async function newDeck(args) {
    const decks = Math.min(Math.max(Number(args.decks ?? 1), 1), 8);
    const d = await get(`${BASE}/deck/new/shuffle/?deck_count=${decks}`);
    if (!d?.success)
        throw new CardsError("Could not create a deck");
    return `New shuffled deck:\n  Deck ID: ${d?.deck_id}\n  Cards remaining: ${d?.remaining ?? decks * 52}\n  Shuffled: ${d?.shuffled ? "yes" : "no"}`;
}
export async function draw(args) {
    const deckId = (args.deckId ?? "").trim();
    if (!deckId)
        throw new CardsError("Provide a deck ID");
    const count = Math.min(Math.max(Number(args.count ?? 1), 1), 52);
    const d = await get(`${BASE}/deck/${encodeURIComponent(deckId)}/draw/?count=${count}`);
    if (!d?.success)
        throw new CardsError(d?.error ?? "Could not draw cards");
    const cards = (d?.cards ?? []);
    return `Drew ${cards.length} card(s) from deck ${deckId} (${d?.remaining} left):\n` + cards.map((c, i) => `${i + 1}. ${c?.value ?? "?"} of ${c?.suit ?? "?"}`).join("\n");
}
export async function reshuffle(args) {
    const deckId = (args.deckId ?? "").trim();
    if (!deckId)
        throw new CardsError("Provide a deck ID");
    const d = await get(`${BASE}/deck/${encodeURIComponent(deckId)}/shuffle/?remaining=true`);
    if (!d?.deck_id)
        throw new CardsError("The deck service returned no deck id");
    return `Deck ${d.deck_id} shuffled:\n  Cards remaining: ${d.remaining ?? "?"}\n  Shuffled: ${d.shuffled ? "yes" : "no"}`;
}

const DECK_API = 'https://deckofcardsapi.com/api';
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'J', 'Q', 'K'];
const SUITS = ['S', 'H', 'D', 'C'];
export async function buildDeck(args = {}) {
    const raw = String(args?.cards ?? '').trim().toUpperCase();
    if (!raw)
        throw new Error('Provide cards, like AS,KD,0H. 0 is the ten.');
    const cards = raw.split(',').map((c) => c.trim()).filter(Boolean);
    const bad = cards.filter((c) => c.length !== 2 || !RANKS.includes(c[0]) || !SUITS.includes(c[1]));
    if (bad.length)
        throw new Error(`Unknown card code(s): ${bad.join(', ')}. Use rank A,2-9,0,J,Q,K with suit S,H,D,C.`);
    if (new Set(cards).size !== cards.length)
        throw new Error('The same card is listed twice.');
    const decks = Math.min(Math.max(Number(args?.deckCount ?? 1) || 1, 1), 6);
    const qs = new URLSearchParams({ cards: cards.join(',') });
    if (decks > 1)
        qs.set('deck_count', String(decks));
    const action = args?.shuffle ? 'new/shuffle' : 'new';
    const res = await fetch(`${DECK_API}/deck/${action}/?${qs}`, {
        headers: { 'User-Agent': 'mrfentmen-deck-of-cards-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Deck of Cards API returned ${res.status}`);
    const d = (await res.json());
    if (!d.success || !d.deck_id)
        throw new Error('Deck of Cards API refused the deck');
    return [
        `Deck ${d.deck_id} built from ${cards.join(', ')}${decks > 1 ? ` x${decks}` : ''}`,
        `Shuffled: ${d.shuffled ? 'yes' : 'no'} · remaining ${d.remaining}`,
        `Draw one: ${DECK_API}/deck/${d.deck_id}/draw/?count=1`,
        `Reshuffle: ${DECK_API}/deck/${d.deck_id}/shuffle/`,
    ].join('\n');
}
