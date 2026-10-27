/**
 * MangaDex API v5 client (public, no auth).
 * Docs: https://api.mangadex.org/docs/
 * Be polite: default rate limits apply (5 req/s per IP).
 */
const BASE = "https://api.mangadex.org";
export class MangaDexError extends Error {
}
async function get(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { Accept: "application/json", "User-Agent": "mangadex-mcp/1.0" },
    });
    if (!res.ok) {
        throw new MangaDexError(`MangaDex API error ${res.status}: ${res.statusText}`);
    }
    return (await res.json());
}
// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------
function pickLocalized(map, prefer = "en") {
    if (!map)
        return undefined;
    return map[prefer] ?? map["ja"] ?? map["ja-ro"] ?? Object.values(map)[0];
}
function mangaTitle(attrs) {
    return (pickLocalized(attrs.title) ??
        attrs.altTitles
            .map((t) => pickLocalized(t))
            .find((t) => !!t) ??
        "Untitled");
}
export async function searchManga(title, limit = 8, lang = "en") {
    const url = `/manga?title=${encodeURIComponent(title)}&limit=${limit}&includes[]=author&includes[]=cover_art`;
    const res = await get(url);
    return res.data.map((m) => {
        const authors = m.relationships
            .filter((r) => r.type === "author")
            .map((r) => r.attributes?.name ?? r.id);
        return {
            id: m.id,
            title: mangaTitle(m.attributes),
            altTitles: m.attributes.altTitles
                .map((t) => pickLocalized(t))
                .filter((t) => !!t)
                .slice(0, 3),
            year: m.attributes.year,
            status: m.attributes.status,
            description: pickLocalized(m.attributes.description),
            tags: m.attributes.tags.map((t) => pickLocalized(t.attributes.name) ?? t.id),
            authors,
            rating: m.attributes.rating,
            followers: m.attributes.followers,
        };
    });
}
export async function getManga(id) {
    const url = `/manga/${id}?includes[]=author&includes[]=cover_art`;
    const res = await get(url);
    const m = res.data[0];
    if (!m)
        return null;
    const authors = m.relationships
        .filter((r) => r.type === "author")
        .map((r) => r.attributes?.name ?? r.id);
    return {
        id: m.id,
        title: mangaTitle(m.attributes),
        altTitles: m.attributes.altTitles
            .map((t) => pickLocalized(t))
            .filter((t) => !!t)
            .slice(0, 3),
        year: m.attributes.year,
        status: m.attributes.status,
        description: pickLocalized(m.attributes.description),
        tags: m.attributes.tags.map((t) => pickLocalized(t.attributes.name) ?? t.id),
        authors,
        rating: m.attributes.rating,
        followers: m.attributes.followers,
    };
}
export async function getChapters(mangaId, lang = "en", limit = 20, ascending = true) {
    const dir = ascending ? "asc" : "desc";
    const url = `/manga/${mangaId}/feed?translatedLanguage[]=${lang}&limit=${limit}` +
        `&order[chapter]=${dir}&order[volume]=${dir}&includes[]=scanlation_group`;
    const res = await get(url);
    return res.data.map((c) => ({
        id: c.id,
        title: c.attributes.title ?? undefined,
        chapter: c.attributes.chapter,
        volume: c.attributes.volume,
        lang: c.attributes.translatedLanguage,
        pages: c.attributes.pages,
        publishedAt: c.attributes.publishAt,
        groupNames: c.relationships
            .filter((r) => r.type === "scanlation_group")
            .map((r) => r.attributes?.name ?? r.id),
        externalUrl: c.attributes.externalUrl,
    }));
}
export async function searchAuthor(name, limit = 5) {
    const url = `/author?name=${encodeURIComponent(name)}&limit=${limit}`;
    const res = await get(url);
    return res.data.map((a) => ({
        id: a.id,
        name: a.attributes.name,
        biography: pickLocalized(a.attributes.biography),
        twitter: a.attributes.twitter ?? undefined,
        website: a.attributes.website ?? undefined,
    }));
}
export async function getTags() {
    const url = "/manga/tag";
    const res = await get(url);
    return res.data.map((t) => ({
        name: pickLocalized(t.attributes.name) ?? t.id,
        group: t.attributes.group,
    }));
}
// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------
export function formatManga(m) {
    const lines = [
        `[${m.id}] ${m.title}` +
            (m.authors.length ? ` by ${m.authors.join(", ")}` : ""),
        `${m.status ?? "?"} | ${m.year ?? "?"} | ⭐ ${m.rating?.toFixed(2) ?? "?"} | ${m.followers ?? 0} followers`,
    ];
    if (m.tags.length)
        lines.push(`Tags: ${m.tags.slice(0, 8).join(", ")}`);
    if (m.altTitles.length)
        lines.push(`Also known as: ${m.altTitles.join(", ")}`);
    if (m.description)
        lines.push(`\n${m.description.slice(0, 500)}`);
    return lines.join("\n");
}
export function formatChapter(c) {
    const num = c.chapter ? `ch.${c.chapter}` : "oneshot";
    const vol = c.volume ? ` vol.${c.volume}` : "";
    const grp = c.groupNames.length ? ` [${c.groupNames.join(", ")}]` : "";
    const title = c.title ? ` — ${c.title}` : "";
    const when = c.publishedAt ? ` (${c.publishedAt.slice(0, 10)})` : "";
    const ext = c.externalUrl ? ` [external: ${c.externalUrl}]` : "";
    return `${num}${vol}${title}${grp}${when} — ${c.pages}p${ext} — id ${c.id}`;
}
// the statistics route answers { result, statistics }, not the collection shape
// every other MangaDex route uses, so it needs its own fetch
async function getStatistics(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { Accept: "application/json", "User-Agent": "mangadex-mcp/1.0" },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new MangaDexError(`MangaDex API error ${res.status}: ${res.statusText}`);
    return (await res.json());
}
