/**
 * Bandcamp discovery API client, keyless.
 * Uses the same get_web endpoint the Bandcamp Discover page uses.
 */
const API = "https://bandcamp.com/api/discover/3/get_web";
export class BandcampError extends Error {
}
function itemUrl(hints) {
    if (!hints)
        return undefined;
    const sub = hints.subdomain;
    const slug = hints.slug;
    const type = hints.item_type === "t" ? "track" : "album";
    if (!sub || !slug)
        return undefined;
    return `https://${sub}.bandcamp.com/${type}/${slug}`;
}
export async function discover(sort = "top", genreId = 0, page = 0, limit = 5) {
    const res = await fetch(API, {
        method: "POST",
        headers: { "User-Agent": "bandcamp-mcp/1.0", "Content-Type": "application/json" },
        body: JSON.stringify({ g: "all", s: sort, p: page, gn: genreId, f: "all", w: 0 }),
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new BandcampError(`Bandcamp error ${res.status}`);
    const data = (await res.json());
    const items = Array.isArray(data.items) ? data.items : [];
    return items.slice(0, limit).map((it) => {
        const feat = (it.featured_track ?? {});
        const file = (feat.file ?? {});
        return {
            kind: it.type === "t" ? "track" : "album",
            title: String(it.primary_text ?? "?"),
            artist: String(it.secondary_text ?? "?"),
            genre: it.genre_text,
            location: it.location_text,
            publishDate: it.publish_date ? String(it.publish_date) : undefined,
            url: itemUrl(it.url_hints),
            featuredTrack: feat.title ? String(feat.title) : undefined,
            trackDuration: typeof feat.duration === "number" ? Math.round(feat.duration) : undefined,
            streamUrl: typeof file["mp3-128"] === "string" ? String(file["mp3-128"]) : undefined,
        };
    });
}
const fmtDur = (s) => s === undefined ? "" : ` (${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")})`;
export function formatItem(it, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    const lines = [
        `${prefix}[${it.kind}] ${it.title} — ${it.artist}${it.genre ? ` (${it.genre})` : ""}`,
        it.publishDate ? `Released: ${it.publishDate}` : "",
        it.location ? `From: ${it.location}` : "",
        it.featuredTrack ? `Featured: ${it.featuredTrack}${fmtDur(it.trackDuration)}` : "",
        it.url ? `Page: ${it.url}` : "",
        it.streamUrl ? `Preview: ${it.streamUrl}` : "",
    ].filter(Boolean);
    return lines.join("\n");
}
// ---- muxE tools:
// The one existing tool lists items from the discover feed and prints a single
// featured track each. The new ones read two things it never touches: the full
// record behind one album or track page, and the shape of a whole page of the
// discover feed rather than a list of it.
const DISCOVER_API = "https://bandcamp.com/api/discover/3/get_web";
const TRALBUM_API = "https://bandcamp.com/api/mobile/24/tralbum_details";
const PAGE_UA = "bandcamp-mcp/1.0";
async function fetchText(url, accept) {
    const res = await fetch(url, {
        headers: { "User-Agent": PAGE_UA, Accept: accept },
        signal: AbortSignal.timeout(30000),
    });
    if (res.status === 404)
        throw new BandcampError(`Bandcamp has nothing at that address.`);
    if (!res.ok)
        throw new BandcampError(`Bandcamp returned HTTP ${res.status}`);
    const body = await res.text();
    if (!body.trim())
        throw new BandcampError("Bandcamp returned an empty page.");
    return body;
}
async function getJson(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": PAGE_UA, Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new BandcampError(`Bandcamp returned HTTP ${res.status}`);
    return (await res.json());
}
const secs = (s) => {
    if (typeof s !== "number" || !Number.isFinite(s) || s < 0)
        return "length not reported";
    return `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
};
const money = (value, currency) => {
    if (typeof value !== "number" || !Number.isFinite(value))
        return "price not reported";
    return `${value.toFixed(2)}${currency ? ` ${currency}` : ""}`;
};
/** bandcamp page urls only, so a caller cannot point this at some other host */
function checkedPageUrl(raw) {
    const text = (raw ?? "").trim();
    if (!text)
        throw new BandcampError("Provide the Bandcamp album or track page url.");
    let parsed;
    try {
        parsed = new URL(text.startsWith("http") ? text : `https://${text}`);
    }
    catch {
        throw new BandcampError("That does not look like a url. Use the Page: link the discover tool prints.");
    }
    if (!/(^|\.)bandcamp\.com$/i.test(parsed.hostname)) {
        throw new BandcampError("Only a bandcamp.com page is supported.");
    }
    if (!/^\/(album|track)\/[\w.-]+$/.test(parsed.pathname)) {
        throw new BandcampError("The path must be /album/<slug> or /track/<slug>.");
    }
    return parsed.toString();
}
export async function discoverProfile(args = {}) {
    const sort = args.sort === "new" ? "new" : "top";
    const genreId = Math.max(0, Math.min(Math.floor(Number(args.genre_id ?? 0) || 0), 1000));
    const page = Math.max(0, Math.min(Math.floor(Number(args.page ?? 0) || 0), 20));
    const res = await fetch(DISCOVER_API, {
        method: "POST",
        headers: { "User-Agent": PAGE_UA, "Content-Type": "application/json" },
        body: JSON.stringify({ g: "all", s: sort, p: page, gn: genreId, f: "all", w: 0 }),
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new BandcampError(`Bandcamp returned HTTP ${res.status}`);
    const data = (await res.json());
    const items = Array.isArray(data.items) ? data.items : [];
    if (!items.length)
        throw new BandcampError("That page of the Bandcamp feed came back empty.");
    const tally = (pick) => {
        const out = new Map();
        for (const it of items) {
            const value = pick(it);
            if (value === undefined || value === null || value === "")
                continue;
            const key = String(value);
            out.set(key, (out.get(key) ?? 0) + 1);
        }
        return out;
    };
    const ranked = (m, take) => {
        const sorted = [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
        const shown = sorted.slice(0, take).map(([k, n]) => `${k} (${n})`);
        if (sorted.length > take)
            shown.push(`and ${sorted.length - take} more`);
        return shown;
    };
    const months = new Map();
    for (const it of items) {
        const stamp = typeof it.publish_date === "string" ? Date.parse(it.publish_date) : Number.NaN;
        if (Number.isNaN(stamp))
            continue;
        const month = new Date(stamp).toISOString().slice(0, 7);
        months.set(month, (months.get(month) ?? 0) + 1);
    }
    const preorders = items.filter((it) => it.is_preorder === 1 || it.is_preorder === true).length;
    const withStream = items.filter((it) => {
        const file = (it.featured_track ?? {}).file;
        return typeof file?.["mp3-128"] === "string";
    }).length;
    const total = typeof data.total_count === "number" ? data.total_count : items.length;
    const lines = [
        `Shape of the Bandcamp ${sort === "new" ? "new arrivals" : "trending"} feed${genreId ? ` for genre id ${genreId}` : " across all genres"}, page ${page}:`,
        `  items on this page: ${items.length}`,
        `  items the feed says the whole listing holds: ${total}`,
        `  albums: ${items.filter((it) => it.type !== "t").length}, single tracks: ${items.filter((it) => it.type === "t").length}`,
        `  still a preorder: ${preorders}, released: ${items.length - preorders}`,
        `  with a 128 kbps preview stream: ${withStream}`,
        `  genres on this page: ${tally((it) => it.genre_text).size}`,
        `    ${ranked(tally((it) => it.genre_text), 10).join(", ")}`,
    ];
    const places = tally((it) => it.location_text);
    lines.push(`  distinct locations: ${places.size}`);
    lines.push(`    ${ranked(places, 8).join(", ")}`);
    lines.push(`  release months represented: ${months.size}`);
    lines.push(`    ${ranked(months, 8).join(", ")}`);
    lines.push("  every count above is tallied from the items in this one feed response.");
    return lines.join("\n");
}
