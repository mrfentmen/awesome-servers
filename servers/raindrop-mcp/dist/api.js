export class RaindropError extends Error {
    constructor(message) {
        super(message);
        this.name = "RaindropError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function headers() {
    const k = process.env.RAINDROP_TOKEN;
    if (!k)
        throw new RaindropError("Set RAINDROP_TOKEN (Raindrop integrations).");
    return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}
async function get(path) {
    let res;
    try {
        res = await fetch("https://api.raindrop.io/rest/v1" + path, {
            headers: headers(),
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new RaindropError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new RaindropError(`HTTP ${res.status}: ${body}`);
    }
    return (await res.text()).slice(0, 12000);
}
export function user() {
    return get("/user");
}
export function collections() {
    return get("/collections");
}
export function raindrops(collectionId) {
    return get(`/raindrops/${encodeURIComponent(collectionId)}?perpage=20`);
}
// ---- muxH tools:
// The tools above read an existing Raindrop account. These two do the job a
// read-later tool exists to do before anything is saved: work out what a link
// actually is, and work out whether the book behind it is worth the time.
const NOEMBED = "https://noembed.com/embed";
const OPENLIBRARY = "https://openlibrary.org";
const RD_UA = "raindrop-mcp/1.1 (https://github.com/mrfentmen/raindrop-mcp)";
function metaContent(html, name) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
        new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]*content=["']([^"']*)["']`, "i"),
        new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${escaped}["']`, "i"),
    ];
    for (const pattern of patterns) {
        const match = pattern.exec(html);
        if (match)
            return match[1].trim();
    }
    return null;
}
const decodeEntities = (value) => value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ");
const tidy = (value, limit) => decodeEntities(String(value ?? "")).replace(/\s+/g, " ").trim().slice(0, limit);
/**
 * What a link actually is, before anything is saved to it: the oEmbed card when
 * the site publishes one, otherwise the Open Graph and Twitter card tags and the
 * document title, with the HTTP status the link currently returns.
 */
export async function linkPreview(args) {
    const raw = (args.url ?? "").trim();
    if (!raw)
        throw new RaindropError("Give a URL to preview.");
    const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    let target;
    try {
        target = new URL(url);
    }
    catch {
        throw new RaindropError(`"${raw}" is not a URL.`);
    }
    const lines = [`Link preview for ${target.toString()}`, ""];
    let card = null;
    try {
        const res = await fetch(`${NOEMBED}?url=${encodeURIComponent(target.toString())}`, {
            headers: { Accept: "application/json", "User-Agent": RD_UA },
            signal: AbortSignal.timeout(20000),
        });
        if (res.ok)
            card = (await res.json());
    }
    catch {
        card = null;
    }
    if (card && !card.error) {
        const size = [card.thumbnail_width, card.thumbnail_height].filter((n) => Number.isFinite(Number(n)));
        lines.push("oEmbed card (the site publishes one):");
        lines.push(`  title: ${tidy(card.title, 200) || "not reported"}`);
        lines.push(`  author: ${tidy(card.author_name, 100) || "not reported"}`);
        lines.push(`  provider: ${tidy(card.provider_name, 100) || "not reported"}`);
        lines.push(`  type: ${tidy(card.type, 40) || "not reported"}`);
        lines.push(`  thumbnail: ${card.thumbnail_url ?? "not reported"}${size.length === 2 ? ` (${size[0]}x${size[1]})` : ""}`);
        lines.push("");
    }
    else {
        lines.push(`oEmbed: no card published for this host${card?.error ? ` (${card.error})` : ""}`);
        lines.push("reading the page's own metadata instead:");
    }
    let status = 0;
    let contentType = "not reported";
    let html = "";
    try {
        const res = await fetch(target, {
            headers: { "User-Agent": "Mozilla/5.0 (compatible; raindrop-mcp)", Accept: "text/html,*/*" },
            redirect: "follow",
            signal: AbortSignal.timeout(25000),
        });
        status = res.status;
        contentType = res.headers.get("content-type") ?? "not reported";
        const finalUrl = res.url && res.url !== target.toString() ? res.url : null;
        if (finalUrl)
            lines.push(`  redirects to: ${finalUrl}`);
        const type = res.headers.get("content-type") ?? "";
        if (type.includes("html"))
            html = (await res.text()).slice(0, 400000);
    }
    catch (e) {
        lines.push(`  the page could not be fetched: ${e instanceof Error ? e.message : String(e)}`);
    }
    if (html) {
        const titleTag = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1];
        const canonical = /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)/i.exec(html)?.[1];
        const published = metaContent(html, "article:published_time") ?? metaContent(html, "og:article:published_time");
        const rows = [
            ["og:title", tidy(metaContent(html, "og:title"), 200) || tidy(titleTag, 200) || "not reported"],
            ["og:description", tidy(metaContent(html, "og:description") ?? metaContent(html, "description"), 320) || "not reported"],
            ["og:image", metaContent(html, "og:image") ?? "not reported"],
            ["og:type", tidy(metaContent(html, "og:type"), 40) || "not reported"],
            ["og:site_name", tidy(metaContent(html, "og:site_name"), 80) || "not reported"],
            ["published", tidy(published, 40) || "not reported"],
            ["canonical", canonical ? tidy(canonical, 200) : "not reported"],
            ["<title>", tidy(titleTag, 200) || "not reported"],
        ];
        lines.push("");
        for (const [key, value] of rows)
            lines.push(`  ${key.padEnd(15)} ${value}`);
    }
    lines.push("");
    lines.push(`  HTTP ${status || "no response"} | content type ${contentType} | host ${target.hostname}`);
    if (status === 404)
        lines.push("  the link is dead right now, so saving it will save a 404.");
    if (status >= 500)
        lines.push("  the origin is failing, so this is a server error rather than a missing page.");
    if (status && status < 400 && !/text\/html/i.test(contentType)) {
        lines.push("  the link is not HTML, so there is nothing to read: it is a file or an API response.");
    }
    return lines.join("\n");
}
/**
 * What a book actually is, from Open Library: the work's description, its first
 * publication, how many editions exist, the subjects and the average rating, so
 * a link to a book can be judged before it is saved.
 */
export async function bookLookup(args) {
    const title = (args.title ?? "").trim();
    if (title.length < 2)
        throw new RaindropError("Give a book title of at least two characters.");
    const author = (args.author ?? "").trim();
    const size = Math.min(Math.max(Math.trunc(args.limit ?? 5), 1), 15);
    const query = author ? `${title} ${author}` : title;
    const fields = "key,title,author_name,first_publish_year,edition_count,ratings_average,ratings_count,subject,language,isbn,publisher,person,place";
    const search = await fetch(`${OPENLIBRARY}/search.json?q=${encodeURIComponent(query)}&limit=${size}&fields=${fields}`, { headers: { Accept: "application/json", "User-Agent": RD_UA }, signal: AbortSignal.timeout(25000) });
    if (!search.ok)
        throw new RaindropError(`Open Library search error ${search.status}: ${search.statusText}`);
    const data = (await search.json());
    const docs = data.docs ?? [];
    if (!docs.length)
        throw new RaindropError(`Open Library has nothing matching "${query}".`);
    const top = docs[0];
    let work = null;
    if (top.key) {
        const res = await fetch(`${OPENLIBRARY}${top.key}.json`, {
            headers: { Accept: "application/json", "User-Agent": RD_UA },
            signal: AbortSignal.timeout(20000),
        });
        if (res.ok)
            work = (await res.json());
    }
    const description = typeof work?.description === "string" ? work.description : work?.description?.value;
    const subjects = work?.subjects ?? top.subject ?? [];
    const editionKey = top.key ?? "not reported";
    return [
        `Book lookup: ${top.title ?? title}${top.author_name?.length ? ` by ${top.author_name.slice(0, 3).join(", ")}` : ""}`,
        `  ${data.numFound?.toLocaleString() ?? "an unknown number of"} works match "${query}", showing ${docs.length}`,
        `  Open Library work: ${editionKey}`,
        `  first published: ${work?.first_publish_date ?? top.first_publish_year ?? "not reported"}`,
        `  editions catalogued: ${top.edition_count ?? "not reported"}`,
        `  average rating: ${top.ratings_average === undefined ? "not reported" : `${top.ratings_average.toFixed(2)} (${top.ratings_count ?? 0} ratings)`}`,
        "",
        `Subjects (${subjects.length}): ${subjects.slice(0, 14).join(" | ") || "none recorded"}`,
        top.person?.length ? `People mentioned: ${top.person.slice(0, 6).join(" | ")}` : "",
        top.place?.length ? `Places mentioned: ${top.place.slice(0, 6).join(" | ")}` : "",
        (top.isbn ?? []).length ? `ISBNs on file: ${(top.isbn ?? []).slice(0, 4).join(", ")} (+${(top.isbn ?? []).length - 4} more)` : "ISBNs on file: none",
        (top.publisher ?? []).length ? `Publishers: ${(top.publisher ?? []).slice(0, 5).join(" | ")}` : "",
        "",
        description ? `Description: ${tidy(description, 420)}` : "Description: Open Library records none for this work.",
        "",
        "Other editions and editions of the same title:",
        ...docs.slice(1, size).map((doc, i) => `  ${String(i + 2).padStart(2)}. ${String(doc.title ?? "untitled").slice(0, 44).padEnd(44)} ${doc.first_publish_year ?? "year not reported"}, ${doc.edition_count ?? "?"} edition(s)${doc.author_name?.length ? ` — ${String(doc.author_name[0]).slice(0, 30)}` : ""}`),
        docs.length <= 1 ? "  nothing else matched." : "",
        "",
        "Source: Open Library, a public catalogue. Coverage and ratings are crowd-sourced, so absence of a rating is not a judgement.",
    ]
        .filter((line) => line !== "")
        .join("\n");
}
