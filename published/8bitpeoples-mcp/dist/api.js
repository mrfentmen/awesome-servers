/**
 * 8bitpeoples client. The legendary free chiptune record label, running
 * since 1999. The storefront is a custom shop (not Shopify), so the
 * catalog lives at /categories/digital-discography (paginated) and each
 * release has a /products/<id>-<slug> page with full metadata.
 */
const BASE = "https://www.8bitpeoples.com";
export class BitError extends Error {
}
async function fetchText(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "User-Agent": "8bitpeoples-mcp/1.0", Accept: "text/html" },
        redirect: "follow",
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new BitError(`8bitpeoples error ${res.status} for ${path}`);
    return res.text();
}
function stripTags(s) {
    return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
/** '520414-sievert-chips-dips-and-facerips' -> 'Sievert: Chips, Dips and Facerips' */
export function titleFromSlug(slug) {
    const base = (slug.split("/").pop() ?? slug).replace(/^\d+-/, "");
    return base
        .split("-")
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
        .join(" ");
}
/** Strip tags, decode nbsp entities, collapse whitespace. */
function cleanText(s) {
    return stripTags(s)
        .replace(/&nbsp;/gi, " ")
        .replace(/&#\d+;/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}
/** The info anchors look like: 8BP142<br> Random: Arpeggio Springs. */
export function parseListing(html) {
    const out = [];
    const re = /<a[^>]*class="[^"]*info[^"]*"[^>]*href="(\/products\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
    let m;
    while ((m = re.exec(html)) !== null) {
        const slug = m[1];
        if (out.some((r) => r.slug === slug))
            continue;
        const text = cleanText(m[2]);
        const title = text.replace(/^8BP\d+\s*/, "").trim() || titleFromSlug(slug);
        out.push({ slug, title, url: `${BASE}${slug}` });
    }
    return out;
}
export async function listReleases(page = 1) {
    const html = await fetchText(`/categories/digital-discography?page=${page}`);
    const releases = parseListing(html);
    if (releases.length === 0 && page === 1) {
        // Fall back to the homepage which lists the newest releases.
        return parseListing(await fetchText("/"));
    }
    return releases;
}
export async function getRelease(slug) {
    const clean = slug.startsWith("/products/") ? slug : `/products/${slug}`;
    const html = await fetchText(clean);
    const title = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1]?.trim() ??
        html.match(/property="og:title" content="([^"]+)"/i)?.[1] ??
        html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() ??
        titleFromSlug(clean);
    const desc = html.match(/<meta name="description" content="([^"]+)"/i)?.[1] ??
        html.match(/property="og:description" content="([^"]+)"/i)?.[1];
    return {
        slug: clean,
        title: stripTags(title),
        description: desc ? stripTags(desc).slice(0, 400) : undefined,
        url: `${BASE}${clean}`,
    };
}
export function formatRelease(r, index) {
    const lines = [
        `${index !== undefined ? `${index + 1}. ` : ""}${r.title}`,
        r.description ? r.description : "Free digital release",
        r.url,
    ].filter(Boolean);
    return lines.join("\n");
}
// ---- pay1 tools:
/** Product slugs and artist slugs are plain lowercase words, so reject anything else. */
function pathFor(kind, slug) {
    const clean = (slug ?? "")
        .trim()
        .replace(/^\/+/, "")
        .replace(/^(products|artists)\//, "");
    if (!/^[A-Za-z0-9._-]+$/.test(clean)) {
        throw new BitError(`"${slug}" is not a valid 8bitpeoples ${kind} slug`);
    }
    return `/${kind}s/${clean}`;
}
/** The /artists index repeats every artist for its "Read more" link, so key by slug. */
export function parseArtists(html) {
    const out = new Map();
    const re = /<a[^>]*href="(\/artists\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
    let m;
    while ((m = re.exec(html)) !== null) {
        const name = cleanText(m[2]);
        if (!name || /read more/i.test(name))
            continue;
        const slug = m[1].replace(/^\/artists\//, "");
        if (!out.has(slug))
            out.set(slug, { slug, name, url: `${BASE}${m[1]}` });
    }
    return [...out.values()];
}
export async function listArtists(limit = 100) {
    const capped = Math.max(1, Math.min(Math.trunc(limit), 200));
    const artists = parseArtists(await fetchText("/artists")).slice(0, capped);
    if (!artists.length)
        return "No artists listed.";
    return (`8bitpeoples artists (${artists.length} shown):\n\n` +
        artists.map((a, i) => `${i + 1}. ${a.name} - ${a.url}`).join("\n"));
}
/** Artist pages link their releases as /products/<id>-<slug>, twice each. */
export function parseArtistReleases(html, limit) {
    const seen = new Set();
    const releases = [];
    const re = /href="(\/products\/[^"]+)"/g;
    let m;
    while ((m = re.exec(html)) !== null) {
        if (seen.has(m[1]))
            continue;
        seen.add(m[1]);
        releases.push({ slug: m[1], title: titleFromSlug(m[1]), url: `${BASE}${m[1]}` });
    }
    return releases.slice(0, limit);
}
