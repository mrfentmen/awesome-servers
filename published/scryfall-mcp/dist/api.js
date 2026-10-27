/**
 * Scryfall client — Magic: The Gathering card database.
 * Docs: https://scryfall.com/docs/api — keyless, ~10 req/s.
 * We keep a small inter-request gap to stay comfortably under the limit.
 */
const BASE = "https://api.scryfall.com";
export class ScryfallError extends Error {
}
let lastRequest = 0;
async function getJson(path) {
    const now = Date.now();
    const gap = 150 - (now - lastRequest);
    if (gap > 0)
        await new Promise((r) => setTimeout(r, gap));
    lastRequest = Date.now();
    const res = await fetch(`${BASE}${path}`, {
        signal: AbortSignal.timeout(30000),
        headers: { Accept: "application/json", "User-Agent": "scryfall-mcp/1.0" },
    });
    if (!res.ok)
        throw new ScryfallError(`Scryfall error ${res.status}: ${res.statusText}`);
    return (await res.json());
}
// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------
export async function searchCards(query, pageSize = 8) {
    const data = await getJson(`/cards/search?q=${encodeURIComponent(query)}&page_size=${pageSize}`);
    return (data.data ?? []).map(mapCard);
}
export async function getCardByFuzzyName(name) {
    try {
        const c = await getJson(`/cards/named?fuzzy=${encodeURIComponent(name)}`);
        return mapCard(c);
    }
    catch (e) {
        if (e instanceof ScryfallError && e.message.includes("404"))
            return null;
        throw e;
    }
}
export async function getCardRulings(cardId) {
    const data = await getJson(`/cards/${cardId}/rulings`);
    return (data.data ?? []).map((r) => ({
        oracle_id: r.oracle_id ?? "",
        source: r.source ?? "",
        published_at: r.published_at ?? "",
        comment: r.comment ?? "",
    }));
}
export async function getSets() {
    const data = await getJson(`/sets`);
    return (data.data ?? [])
        .slice(0, 40)
        .map((s) => ({
        code: s.code ?? "",
        name: s.name ?? "?",
        released_at: s.released_at,
        card_count: s.card_count,
        set_type: s.set_type,
    }));
}
/** A single random card — handy for deck ideas and discovery. */
export async function getRandomCard() {
    return mapCard(await getJson(`/cards/random`));
}
/** Cards from one set, e.g. 'dmu'. Scryfall's set: syntax, newest first is not guaranteed. */
export async function searchSet(setCode, pageSize = 20) {
    const code = setCode.trim().toLowerCase();
    const data = await getJson(`/cards/search?q=set%3A${encodeURIComponent(code)}&order=name&page_size=${Math.min(Math.max(pageSize, 1), 40)}`);
    return { total: data.total_cards ?? (data.data ?? []).length, cards: (data.data ?? []).map(mapCard) };
}
// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------
function mapCard(c) {
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
    };
}
export function fmtPrice(usd) {
    if (!usd)
        return "—";
    return `$${usd}`;
}
export function formatCard(c, index) {
    const head = `${index !== undefined ? `${index + 1}. ` : ""}${c.name}${c.mana_cost ? ` ${c.mana_cost}` : ""}`;
    const stats = [c.power && c.toughness ? `${c.power}/${c.toughness}` : "", c.loyalty ? `Loyalty ${c.loyalty}` : ""]
        .filter(Boolean)
        .join(" · ");
    const lines = [
        head,
        c.type_line ?? "",
        c.oracle_text ?? "",
        c.flavor_text ? `*${c.flavor_text}*` : "",
        stats,
        `${c.set_name ?? c.set ?? ""} ${c.rarity ?? ""}${c.collector_number ? ` #${c.collector_number}` : ""}`,
        `Price: ${fmtPrice(c.prices?.usd)}${c.prices?.usd_foil ? ` / foil ${fmtPrice(c.prices.usd_foil)}` : ""}`,
    ].filter(Boolean);
    if (c.image_uris?.normal)
        lines.push(c.image_uris.normal);
    return lines.join("\n");
}
export function formatRuling(r, i) {
    return `${i + 1}. (${r.source}${r.published_at ? `, ${r.published_at}` : ""}) ${r.comment}`;
}
/** Price breakdown across every market Scryfall tracks, plus the cheapest printing note. */
export function formatPrices(c) {
    const p = c.prices ?? {};
    const lines = [
        `${c.name} — ${c.set_name ?? c.set ?? "?"} (${c.set ?? "?"}) ${c.rarity ?? ""}${c.collector_number ? ` #${c.collector_number}` : ""}`.trim(),
        `TCGplayer (USD, non-foil): ${fmtPrice(p.usd)}`,
        `TCGplayer (USD, foil):     ${fmtPrice(p.usd_foil)}`,
        `Cardmarket (EUR):          ${p.eur ? `€${p.eur}` : "—"}`,
        `MTGO (tix):                ${p.tix ? `${p.tix} tix` : "—"}`,
    ];
    if (!p.usd && !p.usd_foil && !p.eur && !p.tix) {
        lines.push("No market prices published for this printing yet.");
    }
    return lines.join("\n");
}
// ---- batch-5 tools: bulk collection lookup, exact printing, mana symbols, name completion (2026-09-27) ----
/**
 * The collection endpoint is the only POST in the Scryfall API, so it needs its
 * own request helper. It keeps the same inter-request gap as getJson so the
 * server's rate limit is respected either way.
 */
async function postJson(path, body) {
    const now = Date.now();
    const gap = 150 - (now - lastRequest);
    if (gap > 0)
        await new Promise((r) => setTimeout(r, gap));
    lastRequest = Date.now();
    const res = await fetch(`${BASE}${path}`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json", "User-Agent": "scryfall-mcp/1.0" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new ScryfallError(`Scryfall error ${res.status}: ${res.statusText}`);
    return (await res.json());
}
/** One line per card, for lists: name, set, number, rarity and price. */
const shortCard = (c) => `${c.name}${c.mana_cost ? ` ${c.mana_cost}` : ""} — ${c.set_name ?? c.set ?? "?"} (${c.set ?? "?"}) ${c.rarity ?? ""}${c.collector_number ? ` #${c.collector_number}` : ""} — ${fmtPrice(c.prices?.usd)}`;
/**
 * Resolves a whole decklist or want-list in one request, up to Scryfall's limit
 * of 75 identifiers, and names the ones that did not resolve instead of
 * silently dropping them.
 */
export async function cardsByCollection(args) {
    const names = (args.names ?? []).map((n) => String(n).trim()).filter(Boolean);
    if (!names.length)
        throw new ScryfallError("Give at least one card name.");
    if (names.length > 75)
        throw new ScryfallError(`Scryfall resolves at most 75 cards per request; ${names.length} were given. Send them in batches.`);
    const reply = await postJson("/cards/collection", { identifiers: names.map((name) => ({ name })) });
    const found = (reply.data ?? []).map((raw) => mapCard(raw));
    const missing = (reply.not_found ?? []).map((raw) => {
        const row = raw;
        return row.name ?? `${row.set ?? "?"} #${row.collector_number ?? "?"}`;
    });
    const usd = found
        .map((c) => Number(c.prices?.usd ?? ""))
        .filter((n) => Number.isFinite(n) && n > 0);
    return [
        `Collection lookup: ${names.length} name(s) asked, ${found.length} resolved, ${missing.length} not found`,
        usd.length ? `  total TCGplayer value of the resolved cards: $${usd.reduce((sum, n) => sum + n, 0).toFixed(2)} (average $${(usd.reduce((sum, n) => sum + n, 0) / usd.length).toFixed(2)})` : "  none of the resolved cards has a published price",
        "",
        found.length ? "Resolved:" : "",
        ...found.map((c, i) => `${i + 1}. ${shortCard(c)}`),
        missing.length ? "\nNot found (check the spelling, or use card_autocomplete first):" : "",
        ...missing.map((name) => `  - ${name}`),
    ].filter((line) => line !== "").join("\n");
}
/**
 * One exact printing by set code and collector number. Search cannot do this
 * reliably: a set search returns every printing, and the number identifies the
 * one card.
 */
export async function cardBySetNumber(args) {
    const set = (args.set ?? "").trim().toLowerCase();
    const number = (args.number ?? "").trim();
    if (!/^[a-z0-9]{2,6}$/.test(set))
        throw new ScryfallError(`"${args.set}" is not a set code, e.g. 'lea' or 'mh3'.`);
    if (!number)
        throw new ScryfallError("Give a collector number, e.g. '233' or '233a'.");
    const raw = await getJson(`/cards/${encodeURIComponent(set)}/${encodeURIComponent(number)}`);
    return formatCard(mapCard(raw));
}
/**
 * Scryfall's symbology: every mana and counter symbol with its meaning, mana
 * value and the SVG file, which is what a card renderer or rules explainer needs.
 */
export async function manaSymbols(args) {
    const query = (args.query ?? "").trim().toLowerCase();
    const limit = Math.min(Math.max(Math.trunc(args.limit ?? 40), 1), 200);
    const reply = await getJson("/symbology");
    const all = reply.data ?? [];
    // A symbol is searched by its name, its meaning and its own flags, so
    // "phyrexian" or "hybrid" find their set instead of coming back empty.
    const haystack = (s) => [s.symbol, s.english, s.represents_mana ? "mana" : "", s.hybrid ? "hybrid" : "", s.phyrexian ? "phyrexian" : "", s.appears_in_mana_costs ? "cost" : ""]
        .join(" ")
        .toLowerCase();
    const rows = query ? all.filter((s) => haystack(s).includes(query)) : all;
    if (!rows.length)
        throw new ScryfallError(`No mana symbol matches "${args.query}".`);
    return [
        `Mana symbols${query ? ` matching "${args.query}"` : ""}: ${rows.length} of ${all.length}`,
        "",
        ...rows.slice(0, limit).map((s) => {
            const tags = [s.represents_mana ? "mana" : "not mana", s.hybrid ? "hybrid" : "", s.phyrexian ? "phyrexian" : ""].filter(Boolean).join(", ");
            return `  ${(s.symbol ?? "?").padEnd(6)} value ${s.mana_value ?? 0} — ${s.english ?? "no meaning published"} (${tags})\n    ${s.svg_uri ?? "no svg"}`.trimEnd();
        }),
        rows.length > limit ? `\nShowing ${limit} of ${rows.length}; raise limit for the rest.` : "",
    ].filter((line) => line !== "").join("\n");
}
/**
 * Name completion, the cheapest way to turn a half-remembered or misspelled
 * card name into one that a search will actually match.
 */
export async function cardAutocomplete(args) {
    const query = (args.query ?? "").trim();
    if (query.length < 2)
        throw new ScryfallError("Give at least two characters of a card name.");
    const reply = await getJson(`/cards/autocomplete?q=${encodeURIComponent(query)}`);
    const names = reply.data ?? [];
    if (!names.length)
        return `No card name starts like "${query}".`;
    return [
        `Card names matching "${query}": ${reply.total_values ?? names.length}`,
        "",
        ...names.map((name) => `  ${name}`),
        "",
        "Pass one of these to search_cards or cards_by_collection rather than the partial name.",
    ].join("\n");
}
// ---- muxH tools:
// set_cards lists a set. These two measure it: what the set is actually made of,
// computed from the card rows themselves, and which keyword abilities really
// appear in it, counted by Scryfall rather than guessed from the rules text.
const SF_UA = "scryfall-mcp/1.2 (https://github.com/mcfentmen/scryfall-mcp)";
/** Every card in a set, following Scryfall's own paging until it stops. */
async function setRows(code, cap) {
    const rows = [];
    let total = 0;
    for (let page = 1; page <= 4; page += 1) {
        const params = new URLSearchParams({
            q: `e:${code}`,
            include_extras: "true",
            include_variations: "true",
            unique: "prints",
            page: String(page),
        });
        const data = await getJson(`/cards/search?${params}`);
        const batch = Array.isArray(data.data) ? data.data : [];
        total = data.total_cards ?? total;
        rows.push(...batch);
        if (!data.has_more || !batch.length || rows.length >= cap)
            break;
    }
    return { rows: rows.slice(0, cap), total };
}
/**
 * What a set is actually made of: the card-type split, the colour identity
 * distribution, a mana-value histogram and the average mana value, all read off
 * the card rows rather than off the set's marketing copy.
 */
export async function setProfile(args) {
    const code = (args.code ?? "").trim().toLowerCase();
    if (!/^[a-z0-9]{2,6}$/.test(code)) {
        throw new ScryfallError(`"${args.code}" is not a set code. Those look like rix, m21 or dka.`);
    }
    const cap = Math.min(Math.max(Number(args.limit) || 400 || 400, 10), 900);
    const set = await getJson(`/sets/${encodeURIComponent(code)}`).catch(() => null);
    if (!set)
        throw new ScryfallError(`Scryfall has no set with code "${code}".`);
    const { rows, total } = await setRows(code, cap);
    if (!rows.length)
        throw new ScryfallError(`The set ${set.name} returned no cards.`);
    const typeCounts = new Map();
    for (const row of rows) {
        const primary = String(row.type_line ?? "not reported").split(" — ")[0] || "not reported";
        typeCounts.set(primary, (typeCounts.get(primary) ?? 0) + 1);
    }
    const identityCounts = new Map();
    for (const row of rows) {
        const identity = (row.color_identity ?? []).join("") || "colourless";
        identityCounts.set(identity, (identityCounts.get(identity) ?? 0) + 1);
    }
    const cmcs = rows.map((r) => (typeof r.cmc === "number" ? r.cmc : 0));
    const meanCmc = cmcs.length ? cmcs.reduce((a, b) => a + b, 0) / cmcs.length : 0;
    const bands = [
        ["0", 0, 0.99], ["1-2", 1, 2.99], ["3-4", 3, 4.99], ["5-6", 5, 6.99],
        ["7-9", 7, 9.99], ["10+", 10, Number.POSITIVE_INFINITY],
    ];
    const histogram = bands.map(([label, low, high]) => [label, cmcs.filter((c) => c >= low && c <= high).length]);
    const peak = histogram.slice().sort((a, b) => b[1] - a[1])[0];
    const rarities = new Map();
    for (const row of rows) {
        const rarity = String(row.rarity ?? "not reported");
        rarities.set(rarity, (rarities.get(rarity) ?? 0) + 1);
    }
    return [
        `Set profile: ${set.name} (${set.code ?? code})`,
        `  released ${String(set.released_at ?? "not reported").slice(0, 10)} | type ${set.set_type ?? "not reported"} | ${set.digital ? "digital" : "paper"} | Scryfall reports ${set.card_count ?? "?"} card(s)`,
        `  ${rows.length} card row(s) read${rows.length < total ? ` of ${total}, so a set larger than the read cap is partially measured` : ""}`,
        "",
        "Card types:",
        ...[...typeCounts.entries()].sort((a, b) => b[1] - a[1]).map(([type, n]) => `  ${type.padEnd(14)} ${String(n).padStart(4)}  ${((n / rows.length) * 100).toFixed(1)}%`),
        "",
        "Colour identity:",
        ...[...identityCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([identity, n]) => `  ${identity.padEnd(8)} ${String(n).padStart(4)}`),
        identityCounts.size > 10 ? `  (+${identityCounts.size - 10} more identities)` : "",
        "",
        "Mana value:",
        `  average ${meanCmc.toFixed(2)} across ${cmcs.length} row(s), of which ${rows.filter((r) => typeof r.cmc === "number").length} declare one`,
        ...histogram.map(([label, n]) => `  ${label.padEnd(5)} ${String(n).padStart(4)}  ${n > 0 ? "#".repeat(Math.max(1, Math.round((n / Math.max(peak?.[1] ?? 1, 1)) * 40))) : ""}`),
        peak ? `  the peak is ${peak[1]} card(s) at ${peak[0]} mana` : "",
        "",
        "Rarity:",
        ...[...rarities.entries()].sort((a, b) => b[1] - a[1]).map(([rarity, n]) => `  ${rarity.padEnd(12)} ${String(n).padStart(4)}`),
        "",
        "Counts include tokens, alternate art and variations because the query asked for them, so a set with many alts reads larger than its printed size.",
        "Source: the public Scryfall API.",
    ]
        .filter((line) => line !== "")
        .join("\n");
}
/**
 * Which keyword abilities a set actually uses, counted from the card rows
 * themselves, with each keyword's share of the set and the cards that carry it.
 * A card holding two keywords is counted under both, which is how a keyword
 * index is normally read.
 */
export async function keywordIndex(args) {
    const code = (args.code ?? "").trim().toLowerCase();
    if (!/^[a-z0-9]{2,6}$/.test(code)) {
        throw new ScryfallError(`"${args.code}" is not a set code. Those look like rix, m21 or dka.`);
    }
    const cap = Math.min(Math.max(Number(args.limit) || 400 || 400, 10), 900);
    const set = await getJson(`/sets/${encodeURIComponent(code)}`).catch(() => null);
    if (!set)
        throw new ScryfallError(`Scryfall has no set with code "${code}".`);
    const { rows, total } = await setRows(code, cap);
    if (!rows.length)
        throw new ScryfallError(`The set ${set.name} returned no cards.`);
    const byKeyword = new Map();
    const withoutKeywords = [];
    for (const row of rows) {
        const keywords = Array.isArray(row.keywords) ? row.keywords.filter(Boolean) : [];
        if (!keywords.length) {
            if (row.type_line && !/land|artifact/i.test(String(row.type_line))) {
                withoutKeywords.push(String(row.name ?? "unnamed"));
            }
            continue;
        }
        for (const keyword of keywords) {
            byKeyword.set(keyword, [...(byKeyword.get(keyword) ?? []), String(row.name ?? "unnamed")]);
        }
    }
    const catalog = await getJson("/catalog/keyword-abilities").catch(() => ({ data: [] }));
    const known = new Set(Array.isArray(catalog.data) ? catalog.data : []);
    const rows2 = [...byKeyword.entries()].sort((a, b) => b[1].length - a[1].length);
    const size = set.card_count ?? rows.length;
    const cardsWithKeywords = new Set(rows2.flatMap(([, names]) => names)).size;
    const unknown = rows2.filter(([keyword]) => known.size > 0 && !known.has(keyword)).map(([keyword]) => keyword);
    return [
        `Keyword abilities in ${set.name} (${set.code ?? code})`,
        `  ${rows.length} card row(s) read${rows.length < total ? ` of ${total}` : ""} | set size ${size}`,
        `  ${rows2.length} distinct keyword(s) on ${cardsWithKeywords} card(s); ${withoutKeywords.length} non-land, non-artifact card(s) carry none`,
        "",
        "Keyword                      cards  share  example",
        ...rows2.slice(0, 30).map(([keyword, names]) => `  ${keyword.slice(0, 26).padEnd(26)} ${String(names.length).padStart(5)}  ${size ? `${((names.length / size) * 100).toFixed(1)}%` : "?"}  ${names[0]?.slice(0, 34) ?? ""}`),
        rows2.length > 30 ? `  (+${rows2.length - 30} more keywords)` : "",
        "",
        `  rarest keyword(s): ${rows2.slice(-4).reverse().map(([k, n]) => `${k} (${n})`).join(", ") || "none recorded"}`,
        unknown.length ? `  not in Scryfall's catalog of ${known.size}: ${unknown.join(", ")}` : "",
        "",
        "Counted from the card rows rather than from the rules text, so a keyword the cards print but Scryfall has not catalogued still appears. A card with two keywords counts under both, so the column does not sum to the card count.",
        "Source: the public Scryfall API.",
    ]
        .filter((line) => line !== "")
        .join("\n");
}
