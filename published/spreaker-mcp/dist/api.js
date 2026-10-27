export class SpreakerError extends Error {
    constructor(message) {
        super(message);
        this.name = "SpreakerError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://api.spreaker.com/v2";
function optAuth() {
    const tok = process.env.SPREAKER_ACCESS_TOKEN;
    return tok ? { Authorization: "Bearer " + tok } : {};
}
function pretty(data) {
    const t = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t;
}
async function req(path, init = {}) {
    const res = await fetch(BASE + path, { signal: AbortSignal.timeout(30000), headers: { ...UA, ...optAuth(), ...(init.headers ?? {}) }, ...init });
    const ct = res.headers.get("content-type") ?? "";
    const data = ct.includes("json") ? await res.json() : await res.text();
    if (!res.ok) {
        const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300);
        throw new SpreakerError(`HTTP ${res.status}: ${detail}`);
    }
    return pretty(data);
}
export function getShow(showId) {
    return req(`/shows/${encodeURIComponent(showId)}`);
}
export function listShowEpisodes(showId, limit) {
    const q = limit ? `?limit=${encodeURIComponent(limit)}` : "";
    return req(`/shows/${encodeURIComponent(showId)}/episodes${q}`);
}
export function getEpisode(episodeId) {
    return req(`/episodes/${encodeURIComponent(episodeId)}`);
}
export function searchShows(query, limit) {
    const p = new URLSearchParams({ type: "shows", q: query });
    if (limit)
        p.set("limit", limit);
    return req(`/search?${p.toString()}`);
}
export function createShow(title, language) {
    const tok = process.env.SPREAKER_ACCESS_TOKEN;
    if (!tok)
        throw new SpreakerError("Set the SPREAKER_ACCESS_TOKEN environment variable.");
    return req("/shows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, language }),
    });
}
// ---- muxH tools:
// The five tools above all work on a single show or a single episode. These two
// step up a level: who is publishing, what they publish and how often, and a way
// to find individual episodes across every show rather than inside one feed.
const SK_UA = { "User-Agent": "mcfentmen-spreaker-mcp/1.1 (https://github.com/mcfentmen/spreaker-mcp)" };
async function skGet(path) {
    let res;
    try {
        res = await fetch(`${BASE}${path}`, {
            signal: AbortSignal.timeout(30000),
            headers: { ...SK_UA, Accept: "application/json" },
        });
    }
    catch (e) {
        throw new SpreakerError(`Could not reach Spreaker: ${e.message}`);
    }
    const body = (await res.json());
    if (!res.ok) {
        const detail = body?.response?.error?.messages?.[0] ?? `HTTP ${res.status}`;
        throw new SpreakerError(`Spreaker rejected the request: ${detail}`);
    }
    if (body?.response?.error) {
        throw new SpreakerError(`Spreaker reported: ${body.response.error.messages?.[0] ?? "unknown error"}`);
    }
    return (body.response ?? {});
}
/** Spreaker publishes episode duration in milliseconds. */
const spoken = (ms) => {
    if (!ms || !Number.isFinite(ms) || ms < 0)
        return "duration not reported";
    const total = Math.round(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m ${String(s).padStart(2, "0")}s`;
};
const UNKNOWN = "not reported";
const daysBetween = (stamp) => {
    const then = Date.parse(String(stamp ?? "").replace(" ", "T") + "Z");
    if (!Number.isFinite(then))
        return null;
    return (Date.now() - then) / 86400000;
};
/**
 * Everything a network or a sponsor asks about a publisher, from the public
 * user record and its show list: who they are, how much they publish, in what
 * categories, how recently, and how much is flagged explicit or machine-made.
 */
export async function publisherProfile(args) {
    const id = String(args?.user_id ?? "").trim();
    if (!/^\d{1,12}$/.test(id))
        throw new SpreakerError(`"${id}" is not a Spreaker user id; those are the digits in spreaker.com/user/<name>--<id>.`);
    const limit = Math.min(Math.max(Number(args?.limit ?? 12) || 12, 1), 50);
    const user = (await skGet(`/users/${id}`)).user;
    if (!user)
        throw new SpreakerError(`Spreaker has no public user ${id}. A deleted or fully private account answers like this.`);
    // Spreaker's public user-shows endpoint answers with the first eight shows
    // only; larger limits and offset/page are ignored, so this is a sample and
    // the output says so rather than implying a census.
    const shows = (await skGet(`/users/${id}/shows?limit=${Math.min(Math.max(limit, 8), 50)}`)).items ?? [];
    if (!shows.length)
        throw new SpreakerError(`User ${id} has no public show; a draft or unlisted show does not appear in this list.`);
    const categories = new Map();
    const flagged = { explicit: 0, ai: 0 };
    const ages = [];
    for (const s of shows) {
        const name = s.category?.name ?? "uncategorised";
        categories.set(name, (categories.get(name) ?? 0) + 1);
        if (s.explicit)
            flagged.explicit += 1;
        if (s.ai_generated)
            flagged.ai += 1;
        const days = daysBetween(s.last_episode_at);
        if (days !== null)
            ages.push(days);
    }
    const sortedShows = [...shows].sort((a, b) => String(b.last_episode_at ?? "").localeCompare(String(a.last_episode_at ?? "")));
    const fresh7 = ages.filter((d) => d <= 7).length;
    const fresh30 = ages.filter((d) => d <= 30).length;
    const stale365 = ages.filter((d) => d > 365).length;
    const sortedAges = [...ages].sort((a, b) => a - b);
    const medianAge = sortedAges.length ? sortedAges[Math.floor(sortedAges.length / 2)] : null;
    const followerRatio = Number(user.followings_count) > 0 ? Number(user.followers_count) / Number(user.followings_count) : null;
    const catRows = [...categories.entries()].sort((a, b) => b[1] - a[1]);
    const rows = [
        `${user.fullname ?? `user ${id}`} — Spreaker publisher (${user.kind ?? "kind not reported"})`,
        `  plan             ${user.plan ?? UNKNOWN}`,
        `  user id          ${user.user_id ?? id}`,
        `  shows            ${user.shows_count ?? shows.length}${user.shows_count > shows.length ? ` (${shows.length} sampled)` : ""}`,
        `  followers        ${user.followers_count ?? UNKNOWN}`,
        `  following        ${user.followings_count ?? UNKNOWN}${followerRatio !== null ? ` — ${followerRatio.toFixed(1)} follower(s) per account followed` : ""}`,
        `  description      ${user.description ? String(user.description).replace(/\s+/g, " ").slice(0, 200) : "none published"}`,
        `  page             ${user.site_url ?? `https://www.spreaker.com/user/${id}`}`,
        "",
        `Across the ${shows.length} sampled show(s):`,
        `  categories       ${catRows.map(([c, n]) => `${c} ${n}`).join(" | ") || "none recorded"}`,
        `  published in     last 7 days: ${fresh7} | last 30: ${fresh30} | nothing for over a year: ${stale365}`,
        `  median silence   ${medianAge === null ? UNKNOWN : `${medianAge.toFixed(1)} day(s) since the last episode`}`,
        `  flags            ${flagged.explicit} explicit | ${flagged.ai} machine-generated`,
        "",
        `Most recently active shows (top ${Math.min(limit, sortedShows.length)}):`,
    ];
    for (const s of sortedShows.slice(0, limit)) {
        const when = String(s.last_episode_at ?? "").slice(0, 10) || "no episode date";
        const flags = [s.explicit ? "explicit" : null, s.ai_generated ? "machine-generated" : null].filter(Boolean);
        rows.push(`  ${when}  ${s.title ?? "untitled"} — ${s.category?.name ?? "uncategorised"}${flags.length ? ` [${flags.join(", ")}]` : ""}`);
        if (s.site_url)
            rows.push(`              ${s.site_url}`);
    }
    // Recent episodes for the few shows that are actually still publishing.
    const active = sortedShows.filter((s) => {
        const d = daysBetween(s.last_episode_at);
        return d !== null && d <= 90 && s.show_id;
    }).slice(0, 3);
    if (active.length) {
        rows.push("", "Latest episodes from the most recently active show(s):");
        for (const show of active) {
            const episodes = (await skGet(`/shows/${encodeURIComponent(show.show_id)}/episodes?limit=2`)).items ?? [];
            if (!episodes.length)
                continue;
            rows.push(`  ${show.title ?? show.show_id}`);
            for (const e of episodes) {
                rows.push(`    ${String(e.published_at ?? "").slice(0, 10) || "undated"}  ${spoken(e.duration)}  ${e.title ?? "untitled"}${e.explicit ? " [explicit]" : ""}${e.ai_generated ? " [machine-generated]" : ""}`);
            }
        }
    }
    else {
        rows.push("", "No show has published in the last 90 days, so there are no recent episodes to list.");
    }
    rows.push("", `note: counts and categories come from the first ${shows.length} show(s) on the public list, not all ${user.shows_count ?? "?"} — Spreaker returns no more than eight shows per publisher on this endpoint and ignores paging, so a large network is sampled, not censused. Durations are as published; Spreaker reports some episodes without one.`);
    return rows.join("\n");
}
/**
 * Find individual episodes anywhere on Spreaker by keyword, which the show-scoped
 * episode list cannot do: it returns the show each hit belongs to, so a phrase
 * can be traced back to the feed that published it.
 */
export async function episodeSearch(args) {
    const query = String(args.query ?? "").trim();
    if (!query)
        throw new SpreakerError("Give a phrase to search for, for example 'budget'.");
    const limit = Math.min(Math.max(Number(args.limit ?? 10) || 10, 1), 50);
    const found = await skGet(`/search?type=episodes&q=${encodeURIComponent(query)}&limit=${limit}`);
    const rows = found.items ?? [];
    if (!rows.length) {
        return `Spreaker's episode index holds nothing matching "${query}". The index covers published episodes only, so an unlisted or private episode will not appear.`;
    }
    const durations = rows.map((e) => e.duration ?? 0).filter((d) => d > 0);
    const explicit = rows.filter((e) => e.explicit).length;
    const shows = new Set(rows.map((e) => e.show_id));
    return [
        `Episodes matching "${query}" — ${rows.length} hit(s) across ${shows.size} show(s)`,
        `  lengths ${durations.length ? `${spoken(Math.min(...durations))} to ${spoken(Math.max(...durations))}` : "not reported in the hits"} | ${explicit} flagged explicit | ${rows.filter((e) => e.ai_generated).length} flagged machine-generated`,
        "",
        ...rows.map((e, i) => {
            const published = String(e.published_at ?? "").slice(0, 10);
            return [
                `  ${String(i + 1).padStart(2)}. ${e.title ?? "untitled"}`,
                `      show ${e.show_id} | author ${e.author_id} | ${spoken(e.duration)} | published ${published || "not reported"} | type ${e.type ?? "not reported"}`,
                `      ${e.site_url ?? `https://www.spreaker.com/episode/${e.episode_id}`}${e.download_enabled ? " | download enabled" : " | download not enabled"}`,
            ].join("\n");
        }),
        "",
        "Spreaker's search ranks by its own relevance rules and returns a capped page, so this is a sample rather than a complete census of every episode containing the phrase. Titles are matched, not full transcripts.",
    ].join("\n");
}
