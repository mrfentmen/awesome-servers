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
const dayOf = (raw) => {
    const t = Date.parse(String(raw ?? "").replace(" ", "T") + "Z");
    return Number.isFinite(t) ? t : null;
};
/**
 * Who is behind a Spreaker account: how many shows they run, what those shows
 * are categorised as, how recently each was updated, how much of the output is
 * flagged explicit or machine-generated, and who follows them. A show listing
 * cannot answer this, and a publisher spanning hundreds of feeds is exactly the
 * case where it matters.
 */
export async function publisherProfile(args) {
    const raw = String(args.user_id ?? "").trim();
    if (!raw)
        throw new SpreakerError("Give a Spreaker user id, for example 9808747.");
    if (!/^\d+$/.test(raw))
        throw new SpreakerError(`"${raw}" is not a numeric Spreaker user id.`);
    const limit = Math.min(Math.max(Number(args.limit ?? 12) || 12, 1), 50);
    const { user } = await skGet(`/users/${raw}`);
    if (!user)
        throw new SpreakerError(`Spreaker holds no user with id ${raw}.`);
    const shows = await skGet(`/users/${raw}/shows?limit=${limit}`);
    const episodes = await skGet(`/users/${raw}/episodes?limit=${limit}`);
    const showRows = shows.items ?? [];
    const episodeRows = episodes.items ?? [];
    const cats = new Map();
    for (const s of showRows) {
        for (const c of [s.category, s.category_2, s.category_3]) {
            // The category fields arrive as strings on some accounts and as ids on others.
            const key = typeof c === "string" ? c.trim() : c === undefined || c === null ? "" : String(c);
            if (key)
                cats.set(key, (cats.get(key) ?? 0) + 1);
        }
    }
    const dates = showRows
        .map((s) => ({ show: s, at: dayOf(s.last_episode_at) }))
        .filter((e) => e.at !== null)
        .sort((a, b) => b.at - a.at);
    const now = Date.now();
    const stale = dates.filter((e) => now - e.at > 365 * 86400000).length;
    const explicitShows = showRows.filter((s) => s.explicit).length;
    const generated = showRows.filter((s) => s.ai_generated).length;
    const durations = episodeRows.map((e) => e.duration ?? 0).filter((d) => d > 0);
    return [
        `Publisher profile for ${user.fullname ?? `user ${raw}`} (id ${raw})`,
        `  account kind: ${user.kind ?? "not reported"} | plan: ${user.plan ?? "not reported"} | ${user.site_url ?? "no site url"}`,
        `  account totals: ${(user.shows_count ?? 0).toLocaleString()} show(s) | ${(user.followers_count ?? 0).toLocaleString()} follower(s) | following ${(user.followings_count ?? 0).toLocaleString()} account(s)`,
        `  sampled ${showRows.length} show(s) and ${episodeRows.length} recent episode(s)`,
        user.description ? `  description: ${String(user.description).slice(0, 200)}` : "  description: none published",
        "",
        "Categories across the sampled shows:",
        ...(cats.size
            ? [...cats.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([c, n]) => `  ${c.padEnd(28)}${String(n).padStart(3)} show(s)`)
            : ["  none of the sampled shows carries a category"]),
        "",
        `Freshness: ${dates.length ? `most recent episode ${new Date(dates[0].at).toISOString().slice(0, 10)}, quietest ${new Date(dates[dates.length - 1].at).toISOString().slice(0, 10)}` : "no sampled show reports a last episode date"}`,
        `  ${stale} of ${dates.length} sampled show(s) have published nothing in over a year`,
        `  ${explicitShows} of ${showRows.length} show(s) are flagged explicit, ${generated} are flagged as machine-generated`,
        ...(durations.length ? [`  episode length in the sample: shortest ${spoken(Math.min(...durations))}, longest ${spoken(Math.max(...durations))}`] : []),
        "",
        `Shows, most recently updated (${showRows.length} sampled):`,
        ...dates.slice(0, limit).map((e, i) => `  ${String(i + 1).padStart(2)}. ${(e.show.title ?? "untitled").slice(0, 44).padEnd(44)} ${new Date(e.at).toISOString().slice(0, 10)}  ${e.show.explicit ? "explicit" : "clean"}${e.show.ai_generated ? ", machine-generated" : ""}  id ${e.show.show_id}`),
        "",
        `Most recent episodes (${episodeRows.length} sampled):`,
        ...episodeRows.slice(0, 6).map((e, i) => `  ${String(i + 1).padStart(2)}. ${(e.title ?? "untitled").slice(0, 52).padEnd(52)} ${spoken(e.duration)}  ${String(e.published_at ?? "").slice(0, 10)}  show ${e.show_id}${e.explicit ? "  explicit" : ""}`),
        "",
        "show_count and followers_count come from the account record, while the lists above are a single page capped by your limit argument, so the two will not agree. An explicit or machine-generated flag is a publisher-set label, not a detection. Nothing here is read from a private feed.",
    ].join("\n");
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
