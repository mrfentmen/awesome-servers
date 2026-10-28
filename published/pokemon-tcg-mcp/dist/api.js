/**
 * TCGdex API v2 client — the open Pokémon TCG database.
 * Docs: https://www.tcgdex.dev/  (free, no key)
 */
const BASE = "https://api.tcgdex.net/v2/en";
export class TcgError extends Error {
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { Accept: "application/json", "User-Agent": "pokemon-tcg-mcp/1.0" },
    });
    if (!res.ok)
        throw new TcgError(`TCGdex API error ${res.status}: ${res.statusText}`);
    return (await res.json());
}
// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------
export async function searchCards(name, rarity, limit = 12) {
    const rarityParam = rarity ? `&rarity=${encodeURIComponent(rarity)}` : "";
    const data = await getJson(`/cards?name=${encodeURIComponent(name)}${rarityParam}`);
    return (data ?? []).slice(0, limit);
}
export async function getCard(id) {
    const data = await getJson(`/cards/${id}`);
    return data && data.id ? data : null;
}
export async function listSets() {
    const data = await getJson("/sets");
    return (data ?? []).sort((a, b) => (b.releaseDate ?? "").localeCompare(a.releaseDate ?? ""));
}
export async function getSet(id) {
    const data = await getJson(`/sets/${id}`);
    if (!data || !data.id)
        return null;
    return {
        id: data.id,
        name: data.name ?? "?",
        releaseDate: data.releaseDate,
        cardCount: data.cardCount?.total ?? data.cards?.length,
        logo: data.logo,
        cards: (data.cards ?? []).map((c) => ({
            id: c.id,
            localId: c.localId,
            name: c.name,
            category: c.category,
            rarity: c.rarity,
            image: c.image,
        })),
    };
}
// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------
export function formatCardSummary(c) {
    return (`[${c.id}] ${c.name}` +
        (c.rarity ? ` (${c.rarity})` : "") +
        (c.category ? ` — ${c.category}` : "") +
        (c.set?.name ? `\n   Set: ${c.set.name}` : "") +
        (c.image ? `\n   ${c.image}` : ""));
}
export function formatCardDetail(c) {
    const lines = [
        `[${c.id}] ${c.name}${c.rarity ? ` (${c.rarity})` : ""}`,
        `${c.category ?? "?"}${c.hp ? ` | HP ${c.hp}` : ""}` +
            (c.types?.length ? ` | Types: ${c.types.join("/")}` : "") +
            (c.retreat ? ` | Retreat: ${c.retreat}` : ""),
    ];
    for (const a of c.abilities ?? []) {
        lines.push(`\nAbility: ${a.name}\n${a.effect ?? ""}`);
    }
    for (const atk of c.attacks ?? []) {
        lines.push(`\nAttack: ${atk.name}${atk.damage ? ` (${atk.damage})` : ""}` +
            (atk.cost?.length ? ` [${atk.cost.join(" ")}]` : "") +
            (atk.effect ? `\n${atk.effect}` : ""));
    }
    if (c.weakness?.length) {
        lines.push(`Weakness: ${c.weakness.map((w) => `${w.type} ${w.value ?? ""}`.trim()).join(", ")}`);
    }
    if (c.prices) {
        const entries = Object.entries(c.prices)
            .map(([variant, p]) => {
            const low = p.low ? `low $${p.low}` : "";
            const mid = p.average ? `avg $${p.average}` : "";
            const high = p.high ? `high $${p.high}` : "";
            return `${variant}: ${[low, mid, high].filter(Boolean).join(" / ")}`;
        })
            .join(", ");
        if (entries)
            lines.push(`Market prices: ${entries}`);
    }
    if (c.illustrator)
        lines.push(`Illustrator: ${c.illustrator}`);
    if (c.set?.name)
        lines.push(`Set: ${c.set.name}`);
    if (c.image)
        lines.push(`\n${c.image}`);
    return lines.join("\n");
}
export function formatSet(s) {
    return (`[${s.id}] ${s.name}` +
        (s.releaseDate ? ` — ${s.releaseDate}` : "") +
        (s.cardCount ? ` (${s.cardCount} cards)` : ""));
}
