/**
 * VNDB API v2 client.
 * Docs: https://api.vndb.org/kana
 * POST JSON to https://api.vndb.org/kana/<collection> — the collection
 * (vn / character / release / ...) is part of the URL path. A
 * descriptive User-Agent is required. Public API — no auth needed.
 */
const ENDPOINT = "https://api.vndb.org/kana";
export class VndbApiError extends Error {
}
async function post(collection, body) {
    const res = await fetch(`${ENDPOINT}/${collection}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "User-Agent": "vndb-mcp/1.0 (https://github.com/mrfentmen/vndb-mcp)",
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        throw new VndbApiError(`VNDB API error ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }
    return (await res.json());
}
const VN_FIELDS = "id, title, alttitle, titles.lang, titles.title, released, rating, votecount, " +
    "popularity, length, devstatus, description, " +
    "image.url, developers.name, tags.name, platforms";
const CHAR_FIELDS = "id, name, original, gender, birthday, height, description, " +
    "traits.name, vns.id, vns.title";
const RELEASE_FIELDS = "id, title, released, catalog, languages.lang, languages.title, platforms, " +
    "media.medium, media.qty, vns.id, vns.title, producers.name";
// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------
export async function searchVns(query, results = 8, sort = "rating") {
    const data = await post("vn", {
        filters: ["search", "=", query],
        fields: VN_FIELDS,
        sort,
        reverse: sort !== "title",
        results,
    });
    return data.results;
}
export async function getVn(id) {
    const data = await post("vn", {
        filters: ["id", "=", id],
        fields: VN_FIELDS,
        results: 1,
    });
    return data.results[0] ?? null;
}
export async function searchCharacters(query, results = 8) {
    const data = await post("character", {
        filters: ["search", "=", query],
        fields: CHAR_FIELDS,
        sort: "id",
        results,
    });
    return data.results;
}
export async function getReleases(vnId) {
    const data = await post("release", {
        filters: ["vn", "=", ["id", "=", vnId]],
        fields: RELEASE_FIELDS,
        sort: "released",
        reverse: true,
        results: 25,
    });
    return data.results;
}
// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------
const LENGTH = {
    1: "very short (<10h)",
    2: "short (10-30h)",
    3: "medium (30-50h)",
    4: "long (50-100h)",
    5: "very long (>100h)",
};
export function formatVn(v) {
    const title = v.title ?? v.alttitle ?? v.id;
    const devs = v.developers?.length
        ? ` by ${v.developers.map((d) => d.name).join(", ")}`
        : "";
    const rating = v.rating ? ` ★${v.rating.toFixed(2)} (${v.votecount} votes)` : " unrated";
    const lines = [
        `[${v.id}] ${title}${devs}`,
        `Released: ${v.released ?? "?"} | ${LENGTH[v.length ?? 0] ?? "?"}${rating}`,
    ];
    if (v.platforms?.length)
        lines.push(`Platforms: ${v.platforms.join(", ")}`);
    if (v.tags?.length) {
        lines.push(`Tags: ${v.tags.slice(0, 8).map((t) => t.name).join(", ")}`);
    }
    if (v.description)
        lines.push(`\n${strip(v.description).slice(0, 700)}`);
    return lines.join("\n");
}
export function formatCharacter(c) {
    const bio = [
        c.gender?.length ? `Gender: ${c.gender.join("/")}` : "",
        c.birthday?.length === 2 ? `Birthday: ${c.birthday[0]}/${c.birthday[1]}` : "",
        c.height ? `Height: ${c.height}cm` : "",
    ]
        .filter(Boolean)
        .join(" | ");
    const lines = [`[${c.id}] ${c.name ?? "?"}${c.original ? ` (${c.original})` : ""}`];
    if (bio)
        lines.push(bio);
    if (c.traits?.length)
        lines.push(`Traits: ${c.traits.map((t) => t.name).join(", ")}`);
    if (c.vns?.length)
        lines.push(`Appears in: ${c.vns.map((v) => v.title ?? v.id).join(", ")}`);
    if (c.description)
        lines.push(`\n${strip(c.description).slice(0, 600)}`);
    return lines.join("\n");
}
export function formatRelease(r) {
    const langs = r.languages?.map((l) => l.lang?.toUpperCase() ?? "?").join("/") ?? "?";
    const media = r.media?.map((m) => `${m.qty ?? ""}${m.medium ?? ""}`.trim()).join(" + ") ?? "?";
    return (`[${r.id}] ${r.title ?? "?"} (${r.released ?? "?"})` +
        `\nCatalog: ${r.catalog ?? "?"} | Lang: ${langs} | Media: ${media}` +
        (r.producers?.length ? ` | by ${r.producers.map((p) => p.name).join(", ")}` : ""));
}
function strip(s) {
    return s
        .replace(/\[.*?\]/g, "")
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();
}
