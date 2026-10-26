/**
 * SeatGeek API client. Needs SEATGEEK_CLIENT_ID
 * (free at https://seatgeek.com/account/develop).
 * Docs: https://platform.seatgeek.com/
 */
const BASE = "https://api.seatgeek.com/2";
export class SeatGeekError extends Error {
}
function clientId() {
    const id = process.env.SEATGEEK_CLIENT_ID;
    if (!id)
        throw new SeatGeekError("Set SEATGEEK_CLIENT_ID first (free at seatgeek.com/account/develop).");
    return id;
}
async function getJson(path, extra = {}) {
    const qs = new URLSearchParams({ ...extra, client_id: clientId() }).toString();
    const res = await fetch(`${BASE}${path}?${qs}`, {
        headers: { "User-Agent": "seatgeek-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 401 || res.status === 403)
        throw new SeatGeekError("SeatGeek refused (401/403). Check client ID and rate limits.");
    if (res.status === 404)
        throw new SeatGeekError("Not found.");
    if (!res.ok)
        throw new SeatGeekError(`SeatGeek error ${res.status}`);
    return (await res.json());
}
export async function searchEvents(query, limit = 5) {
    if (!query.trim())
        throw new SeatGeekError("Query is empty.");
    const data = await getJson("/events", { q: query.trim(), per_page: String(Math.min(Math.max(limit, 1), 100)) });
    const rows = Array.isArray(data.events) ? data.events : [];
    return rows.slice(0, limit).map(toEvent);
}
const toEvent = (e) => ({
    id: Number(e.id),
    title: e.title ?? e.short_title,
    date: e.datetime_local ? String(e.datetime_local).slice(0, 16).replace("T", " ") : undefined,
    venue: e.venue?.name,
    city: [e.venue?.city, e.venue?.state].filter(Boolean).join(", ") || undefined,
    price: e.stats?.lowest_price !== undefined && e.stats?.lowest_price !== null
        ? `from $${e.stats.lowest_price}${e.stats?.highest_price ? ` to $${e.stats.highest_price}` : ""}`
        : undefined,
    url: e.url,
});
export async function recommendEvents(lat, lon, limit = 5) {
    if (!isFinite(lat) || lat < -90 || lat > 90)
        throw new SeatGeekError("Latitude must be -90..90.");
    if (!isFinite(lon) || lon < -180 || lon > 180)
        throw new SeatGeekError("Longitude must be -180..180.");
    const data = await getJson("/recommendations", { lat: String(lat), lon: String(lon), per_page: String(Math.min(Math.max(limit, 1), 100)) });
    const recs = Array.isArray(data.recommendations) ? data.recommendations : [];
    const out = [];
    for (const r of recs) {
        const e = r.event ?? {};
        if (e.id === undefined)
            continue;
        out.push(toEvent(e));
        if (out.length >= limit)
            break;
    }
    return out;
}
export function formatEvent(e, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    const where = [e.venue, e.city].filter(Boolean).join(", ");
    return `${prefix}[${e.id}] ${e.title ?? "(untitled)"}${e.date ? ` — ${e.date}` : ""}${where ? `\n   ${where}` : ""}${e.price ? `\n   Tickets ${e.price}` : ""}${e.url ? `\n   ${e.url}` : ""}`;
}
// ---- muxH tools:
// SeatGeek sells seats. Before a promoter can price a booking they need to know
// who the act is and how much of a recorded catalogue they can point at, and
// MusicBrainz publishes both without an account.
const MB = "https://musicbrainz.org/ws/2";
const SG_UA = "seatgeek-mcp/1.1 (https://github.com/mcfentmen/seatgeek-mcp; contact seatgeek-mcp@example.com)";
let lastCall = 0;
async function mbGet(path) {
    // MusicBrainz asks for no more than one request a second, unauthenticated.
    const gap = 1050 - (Date.now() - lastCall);
    if (gap > 0)
        await new Promise((resolve) => setTimeout(resolve, gap));
    lastCall = Date.now();
    // MusicBrainz answers 503 when it decides the host is too quick, even at
    // one call a second, so give it two more chances with a growing pause
    // rather than failing a whole catalogue on the first pushed-back request.
    let res = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
        if (attempt > 0)
            await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
        res = await fetch(`${MB}${path}`, {
            headers: { Accept: "application/json", "User-Agent": SG_UA },
            signal: AbortSignal.timeout(25000),
        });
        if (res.status !== 503 && res.status !== 429)
            break;
    }
    if (!res)
        throw new SeatGeekError("MusicBrainz did not answer at all.");
    if (res.status === 400)
        throw new SeatGeekError(`MusicBrainz rejected the query.`);
    if (res.status === 404)
        throw new SeatGeekError("MusicBrainz has no record for that artist.");
    if (res.status === 503 || res.status === 429)
        throw new SeatGeekError("MusicBrainz is rate-limiting this host, and stayed limited through three attempts. Wait a minute and try again.");
    if (!res.ok)
        throw new SeatGeekError(`MusicBrainz error ${res.status}: ${res.statusText}`);
    return (await res.json());
}
const MBID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function findArtist(input) {
    const name = (input ?? "").trim();
    if (!name)
        throw new SeatGeekError("Give an artist name or a MusicBrainz id.");
    if (MBID.test(name)) {
        const artist = await mbGet(`/artist/${name}?inc=aliases&fmt=json`);
        return { artist, exact: true };
    }
    const data = await mbGet(`/artist?query=${encodeURIComponent(`artist:"${name}"`)}&fmt=json&limit=8`);
    const hits = data.artists ?? [];
    if (!hits.length)
        throw new SeatGeekError(`MusicBrainz has no artist matching "${name}".`);
    const exact = hits.find((a) => (a.name ?? "").toLowerCase() === name.toLowerCase()) ?? hits[0];
    return { artist: exact, score: exact.score, exact: (exact.name ?? "").toLowerCase() === name.toLowerCase() };
}
const mbLink = (id) => `https://musicbrainz.org/artist/${id}`;
const dash = (v) => (v === undefined || v === null || v === "" ? "not recorded" : String(v));
const span = (life) => {
    if (!life)
        return "not recorded";
    const begin = life.begin ?? null;
    const end = life.end ?? null;
    if (!begin && !end)
        return "not recorded";
    if (begin && end)
        return `${begin} to ${end}`;
    return begin ? `since ${begin}` : `until ${end}`;
};
/**
 * What a promoter or a journalist needs before a booking: the canonical name,
 * every alias to search under, who is in the act, and where the database keeps
 * the authoritative copy.
 */
export async function artistBriefing(args) {
    const limit = Math.round(Math.min(Math.max(Number(args?.limit ?? 12) || 12, 1), 30));
    const found = await findArtist(args?.artist);
    const base = found.artist;
    const id = base?.id;
    if (!id)
        throw new SeatGeekError("MusicBrainz returned an artist record with no id, so it cannot be expanded.");
    const artist = await mbGet(`/artist/${id}?inc=aliases+artist-rels+url-rels&fmt=json`);
    const aliases = Array.isArray(artist.aliases) ? artist.aliases : [];
    const relations = Array.isArray(artist.relations) ? artist.relations : [];
    const members = relations.filter((r) => r.type === "member of band" && r.artist?.name);
    const urls = relations.filter((r) => r.type === "url" && r.url?.resource);
    const rows = [
        `${artist.name ?? base.name}${artist.disambiguation ? ` (${artist.disambiguation})` : ""}`,
        `  sort name        ${dash(artist["sort-name"])}`,
        `  type             ${dash(artist.type)}`,
        `  country          ${dash(artist.country)}${artist.area?.name ? ` (${artist.area.name})` : ""}`,
        `  active           ${span(artist["life-span"])}${artist["life-span"]?.ended ? " — ended" : ""}`,
        `  matched on       ${found.exact ? "an exact name match" : `a fuzzy match${found.score !== undefined ? ` (score ${found.score})` : ""}`}`,
        `  database         ${mbLink(id)}`,
    ];
    if (aliases.length) {
        rows.push(`  aliases (${aliases.length})`);
        for (const al of aliases.slice(0, limit)) {
            const bits = [al.type, al.locale, al.primary ? "primary" : null, al.begin ?? null, al.end ?? null].filter(Boolean);
            rows.push(`    ${al.name}${bits.length ? ` — ${bits.join(", ")}` : ""}`);
        }
        if (aliases.length > limit)
            rows.push(`    ... ${aliases.length - limit} more`);
    }
    else {
        rows.push("  aliases          none recorded");
    }
    if (members.length) {
        rows.push(`  members (${members.length})`);
        for (const m of members.slice(0, limit)) {
            const role = Array.isArray(m.attributes) && m.attributes.length ? m.attributes.join(", ") : null;
            const when = m.begin || m.end ? ` — ${m.begin ?? "?"} to ${m.ended ? m.end ?? "?" : "present"}` : "";
            rows.push(`    ${m.artist.name}${role ? ` (${role})` : ""}${when}`);
        }
        if (members.length > limit)
            rows.push(`    ... ${members.length - limit} more`);
    }
    else {
        rows.push("  members          no member relationships recorded (a solo act, or nobody has linked them)");
    }
    if (urls.length) {
        const shownLinks = urls.slice(0, 6).map((u) => `${u.url.resource}`);
        rows.push(`  links            ${shownLinks.join(", ")}`);
    }
    rows.push("", "note: names, aliases and memberships are what MusicBrainz contributors have entered, so a very new or very obscure act is often thin here; the release catalogue is a separate tool because it needs paging.");
    return rows.join("\n");
}
/**
 * The recorded catalogue by count, not by opinion: every release group the
 * database holds, split by type and by the decade it first came out.
 */
export async function artistCatalogue(args) {
    const found = await findArtist(args?.artist);
    const base = found.artist;
    const id = base?.id;
    if (!id)
        throw new SeatGeekError("MusicBrainz returned an artist record with no id, so its catalogue cannot be read.");
    const pageSize = 100;
    const cap = 400;
    const groups = [];
    let total = null;
    for (let offset = 0; offset < cap; offset += pageSize) {
        const page = await mbGet(`/release-group?artist=${id}&limit=${pageSize}&offset=${offset}&fmt=json`);
        if (total === null)
            total = Number(page["release-group-count"] ?? 0);
        const rows = Array.isArray(page["release-groups"]) ? page["release-groups"] : [];
        groups.push(...rows);
        if (!rows.length || groups.length >= total)
            break;
    }
    if (!groups.length) {
        throw new SeatGeekError(`MusicBrainz holds no release group for ${base.name ?? id}; the artist is in the database but nothing has been linked to it yet.`);
    }
    const byType = new Map();
    const byDecade = new Map();
    let undated = 0;
    for (const g of groups) {
        const type = g["primary-type"] ?? "untyped";
        byType.set(type, (byType.get(type) ?? 0) + 1);
        const date = String(g["first-release-date"] ?? "");
        const year = Number(date.slice(0, 4));
        if (Number.isFinite(year) && year > 1800) {
            const decade = Math.floor(year / 10) * 10;
            byDecade.set(decade, (byDecade.get(decade) ?? 0) + 1);
        }
        else {
            undated += 1;
        }
    }
    const recent = [...groups]
        .filter((g) => g["first-release-date"])
        .sort((a, b) => String(b["first-release-date"]).localeCompare(String(a["first-release-date"])))
        .slice(0, 12);
    const types = [...byType.entries()].sort((a, b) => b[1] - a[1]);
    const decades = [...byDecade.entries()].sort((a, b) => a[0] - b[0]);
    const rows = [
        `${base.name ?? id} — recorded catalogue`,
        `  release groups   ${total ?? groups.length} in MusicBrainz${groups.length < (total ?? 0) ? ` (counted from the first ${groups.length} browsed)` : ""}`,
        `  by type          ${types.map(([t, n]) => `${t} ${n}`).join(" | ")}`,
        `  first release    ${recent.length ? String(recent[recent.length - 1]["first-release-date"]).slice(0, 10) : "no dates recorded"}`,
    ];
    if (decades.length) {
        rows.push("  by decade");
        const widest = Math.max(...decades.map(([, n]) => n));
        for (const [decade, n] of decades) {
            const bar = "#".repeat(Math.max(1, Math.round((n / widest) * 24)));
            rows.push(`    ${String(decade).padStart(4)}s  ${String(n).padStart(4)}  ${bar}`);
        }
        if (undated)
            rows.push(`    undated  ${String(undated).padStart(4)}  (no first-release-date on the record)`);
    }
    rows.push("", "Most recent releases:");
    for (const g of recent) {
        rows.push(`  ${String(g["first-release-date"]).slice(0, 10)}  ${g.title ?? "untitled"} — ${g["primary-type"] ?? "untyped"}${g.disambiguation ? ` (${g.disambiguation})` : ""}`);
    }
    rows.push("", "note: a release group is the abstract release (an album, a single), not each pressing, so reissues do not inflate this. Compilations and live albums count if they are typed as such, and a bootleg that nobody entered does not exist here.");
    return rows.join("\n");
}
