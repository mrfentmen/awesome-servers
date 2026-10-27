/**
 * YGOPRODeck client — Yu-Gi-Oh! card database.
 * Docs: https://ygoprodeck.com/api-guide/ — keyless.
 */
const BASE = "https://db.ygoprodeck.com/api/v7";
export class YugiohError extends Error {
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { Accept: "application/json", "User-Agent": "yugioh-mcp/1.0" },
    });
    if (!res.ok)
        throw new YugiohError(`YGOPRODeck error ${res.status}: ${res.statusText}`);
    return (await res.json());
}
// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------
export async function searchCardsByName(name) {
    const data = await getJson(`/cardinfo.php?name=${encodeURIComponent(name)}`);
    return (data.data ?? []).map(mapCard);
}
export async function searchCardsByArchetype(archetype) {
    const data = await getJson(`/cardinfo.php?archetype=${encodeURIComponent(archetype)}`);
    return (data.data ?? []).map(mapCard);
}
export async function getCardById(id) {
    try {
        const data = await getJson(`/cardinfo.php?id=${id}`);
        const c = (data.data ?? [])[0];
        return c ? mapCard(c) : null;
    }
    catch {
        return null;
    }
}
export async function getBanlist(banlist = "tcg") {
    // Docs: `banlist=tcg` returns every card with a TCG banlist status in
    // its banlist_info. The separate ban_tcg param no longer exists.
    const data = await getJson(`/cardinfo.php?banlist=${banlist}`);
    return (data.data ?? [])
        .filter((c) => c.banlist_info)
        .map((c) => ({
        name: c.name ?? "?",
        id: c.id,
        tcg: c.banlist_info?.ban_tcg ?? "?",
        ocg: c.banlist_info?.ban_ocg ?? "?",
        goat: c.banlist_info?.ban_goat ?? "?",
    }))
        .sort((a, b) => a.name.localeCompare(b.name));
}
// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------
function mapCard(c) {
    return {
        id: c.id,
        name: c.name ?? "?",
        type: c.type ?? "?",
        frameType: c.frameType,
        desc: c.desc ?? "",
        race: c.race,
        attribute: c.attribute,
        archetype: c.archetype,
        level: c.level,
        atk: c.atk,
        def: c.def,
        scale: c.scale,
        linkval: c.linkval,
        linkmarkers: c.linkmarkers,
        card_images: c.card_images,
        card_prices: c.card_prices,
        banlist_info: c.banlist_info,
        misc_info: c.misc_info,
    };
}
export function formatCard(c, index) {
    const head = `${index !== undefined ? `${index + 1}. ` : ""}${c.name} [${c.id}]`;
    const attr = c.attribute ? ` ${c.attribute}` : "";
    const levelInfo = c.level !== undefined
        ? ` Level ${c.level}`
        : c.linkval !== undefined
            ? ` Link-${c.linkval}${c.linkmarkers?.length ? ` (${c.linkmarkers.join("→")})` : ""}`
            : "";
    const stats = [c.atk !== undefined ? `ATK/${c.atk}` : "", c.def !== undefined ? `DEF/${c.def}` : ""]
        .filter(Boolean)
        .join(" ");
    const ban = c.banlist_info?.ban_tcg ? ` · TCG banlist: ${c.banlist_info.ban_tcg}` : "";
    const price = c.card_prices?.[0];
    const lines = [
        head,
        `${c.type}${attr}${levelInfo}${c.race ? ` · ${c.race}` : ""}${c.archetype ? ` · ${c.archetype}` : ""}`,
        c.desc,
        stats,
        price
            ? `Price: TCGplayer $${price.tcgplayer_price ?? "—"} · Cardmarket €${price.cardmarket_price ?? "—"} · eBay $${price.ebay_price ?? "—"}`
            : "",
        c.banlist_info ? `Banlist: TCG ${c.banlist_info.ban_tcg ?? "—"} / OCG ${c.banlist_info.ban_ocg ?? "—"}` : "",
    ].filter(Boolean);
    if (c.card_images?.[0]?.image_url)
        lines.push(c.card_images[0].image_url);
    return lines.join("\n");
}
export async function stapleCards(args = {}) {
    const limit = Math.max(1, Math.min(Number(args.limit ?? 10) || 10, 30));
    const params = new URLSearchParams({ staple: 'yes', num: String(limit), offset: '0' });
    const data = await getJson(`/cardinfo.php?${params.toString()}`);
    const cards = (data.data ?? []).map(mapCard);
    if (!cards.length)
        return 'No YGOPRODeck staple cards reported.';
    return `Staple cards per YGOPRODeck (${cards.length} shown):\n\n` +
        cards.map((c, i) => formatCard(c, i)).join('\n\n');
}
