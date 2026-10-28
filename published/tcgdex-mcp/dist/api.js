/**
 * TCGdex — keyless public API client.
 */
const BASE = "https://api.tcgdex.net/v2/en";
const SOURCE = "TCGdex";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "tcgdex-mcp", accept },
        });
        if (!res.ok)
            throw new SourceError(`${SOURCE} responded ${res.status}`);
        return res;
    }
    catch (e) {
        if (e instanceof SourceError)
            throw e;
        if (e.name === "AbortError")
            throw new SourceError(`${SOURCE} request timed out`);
        throw new SourceError(`${SOURCE} request failed: ${e.message}`);
    }
    finally {
        clearTimeout(timer);
    }
}
export async function getJson(path, accept = "application/json", timeoutMs = 25000) {
    const res = await request(path, accept, timeoutMs);
    const body = await res.text();
    try {
        return JSON.parse(body);
    }
    catch {
        throw new SourceError(`${SOURCE} returned malformed JSON`);
    }
}
export function clampLimit(n, fallback, max) {
    const v = n ?? fallback;
    if (!Number.isInteger(v) || v < 1 || v > max)
        throw new SourceError(`limit must be between 1 and ${max}`);
    return v;
}
export function clean(s) {
    return String(s ?? "").replace(/\s+/g, " ").trim();
}
export function bullet(label, value) {
    const v = value === undefined || value === null || value === "" ? "" : String(value);
    return v ? `${label}: ${v}` : "";
}
function badId(value, what) {
    return new SourceError(`"${value}" is not a valid ${what}`);
}
function refError(e, message) {
    if (e instanceof SourceError && / 404$/.test(e.message))
        throw new SourceError(message);
    throw e;
}
export async function searchCards(a) {
    const name = clean(a.name);
    if (name.length < 2)
        throw new SourceError("name must be at least 2 characters");
    const limit = clampLimit(a.limit, 12, 50);
    const page = Math.floor(a.page ?? 1);
    if (!Number.isInteger(page) || page < 1 || page > 200)
        throw new SourceError("page must be between 1 and 200");
    const rows = await getJson(`/cards?name=${encodeURIComponent(name)}&pagination:page=${page}&pagination:itemsPerPage=${limit}`, "application/json", 30000);
    if (!Array.isArray(rows) || !rows.length)
        throw new SourceError(`no TCGdex cards match "${name}"`);
    return [
        `${rows.length} card(s) matching "${name}" (page ${page}):`,
        "",
        ...rows.map((c) => `${clean(c.id).padEnd(15)} ${clean(c.name).slice(0, 32).padEnd(33)} ${c.localId ? `#${clean(c.localId)}` : ""}`),
        "",
        "Pass an id such as base1-4 to card_detail for stats, attacks and art.",
    ].join("\n");
}
export async function cardDetail(a) {
    const id = clean(a.cardId).toLowerCase();
    if (!/^[a-z0-9][a-z0-9._-]{1,40}$/.test(id))
        throw badId(a.cardId, "card id");
    let card;
    try {
        card = await getJson(`/cards/${encodeURIComponent(id)}`, "application/json", 30000);
    }
    catch (e) {
        refError(e, `TCGdex has no card with id "${id}"`);
    }
    if (!card || !card.id)
        throw new SourceError(`TCGdex has no card with id "${id}"`);
    const set = card.set ?? {};
    const attacks = Array.isArray(card.attacks) ? card.attacks : [];
    const weaknesses = Array.isArray(card.weaknesses)
        ? card.weaknesses.map((w) => `${clean(w?.type)} ${clean(w?.value)}`).join(", ")
        : "";
    const lines = [
        `${clean(card.name)}${card.localId ? ` (#${clean(card.localId)})` : ""}${card.rarity ? ` · ${clean(card.rarity)}` : ""}`,
        "",
        ...[
            bullet("set", set.id ? `${clean(set.name)} (${clean(set.id)})` : ""),
            bullet("category", card.category),
            bullet("stage", card.stage),
            bullet("hp", card.hp),
            bullet("types", Array.isArray(card.types) ? card.types.join(", ") : ""),
            bullet("evolves from", card.evolveFrom),
            bullet("illustrator", card.illustrator),
            bullet("retreat cost", card.retreat),
            bullet("weaknesses", weaknesses),
            bullet("pokedex", Array.isArray(card.dexId) ? card.dexId.join(", ") : ""),
            bullet("image", card.image ? `${clean(card.image)}/high.webp` : ""),
            bullet("card text", card.effect ? clean(card.effect).slice(0, 220) : ""),
        ].filter(Boolean),
    ];
    if (attacks.length) {
        lines.push("", "Attacks:");
        for (const at of attacks) {
            lines.push(`  ${clean(at?.name)}${at?.damage ? ` — ${clean(at.damage)} damage` : ""}`);
            if (at?.effect)
                lines.push(`    ${clean(at.effect).slice(0, 200)}`);
        }
    }
    if (card.description)
        lines.push("", clean(card.description).slice(0, 300));
    return lines.join("\n");
}
export async function setCards(a) {
    const id = clean(a.setId).toLowerCase();
    if (!/^[a-z0-9][a-z0-9._-]{1,30}$/.test(id))
        throw badId(a.setId, "set id");
    const limit = clampLimit(a.limit, 20, 100);
    let set;
    try {
        set = await getJson(`/sets/${encodeURIComponent(id)}`, "application/json", 30000);
    }
    catch (e) {
        refError(e, `TCGdex has no set with id "${id}"`);
    }
    const cards = Array.isArray(set?.cards) ? set.cards : [];
    if (!cards.length)
        throw new SourceError(`TCGdex lists no cards for set "${id}"`);
    const shown = cards.slice(0, limit);
    return [
        `${clean(set.name)} (${clean(set.id)})${set.releaseDate ? ` · released ${clean(set.releaseDate)}` : ""} — ${cards.length} card(s), showing ${shown.length}:`,
        "",
        ...shown.map((c, i) => `${String(i + 1).padStart(3)}. ${clean(c.id).padEnd(15)} ${clean(c.name)}`),
    ].join("\n");
}
export async function listSets(a) {
    const limit = clampLimit(a.limit, 15, 60);
    const rows = await getJson("/sets", "application/json", 30000);
    if (!Array.isArray(rows) || !rows.length)
        throw new SourceError("TCGdex returned no sets");
    const shown = rows.slice(-limit).reverse();
    return [
        `${rows.length} set(s) on TCGdex, newest ${shown.length} first:`,
        "",
        ...shown.map((s) => {
            const total = s?.cardCount?.total ?? s?.cardCount?.official;
            return `${clean(s.id).padEnd(15)} ${clean(s.name).slice(0, 40).padEnd(41)} ${total ? `${total} cards` : ""}`;
        }),
        "",
        "Pass a set id to set_cards to list its cards.",
    ].join("\n");
}
