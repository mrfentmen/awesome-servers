/**
 * Twitch Helix API client. Needs TWITCH_CLIENT_ID + TWITCH_CLIENT_SECRET
 * (free at https://dev.twitch.tv/console). Uses client-credentials grant.
 * Docs: https://dev.twitch.tv/docs/api/
 */
export class TwitchError extends Error {
}
let cached = null;
async function appToken() {
    const id = process.env.TWITCH_CLIENT_ID;
    const secret = process.env.TWITCH_CLIENT_SECRET;
    if (!id || !secret) {
        throw new TwitchError("Set TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET (free at dev.twitch.tv/console).");
    }
    if (cached && cached.exp > Date.now() + 60000)
        return cached.token;
    const body = new URLSearchParams({ client_id: id, client_secret: secret, grant_type: "client_credentials" });
    const res = await fetch("https://id.twitch.tv/oauth2/token", {
        method: "POST",
        headers: { "User-Agent": "twitch-mcp/1.0", "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        signal: AbortSignal.timeout(15000),
    });
    if (!res.ok)
        throw new TwitchError(`Twitch OAuth failed (${res.status}). Check client id/secret.`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await res.json());
    if (!data.access_token)
        throw new TwitchError("Twitch OAuth returned no token.");
    cached = { token: data.access_token, exp: Date.now() + (data.expires_in ?? 3600) * 1000 };
    return cached.token;
}
async function helix(path) {
    const clientId = process.env.TWITCH_CLIENT_ID;
    const res = await fetch(`https://api.twitch.tv/helix${path}`, {
        headers: { "User-Agent": "twitch-mcp/1.0", Accept: "application/json", "Client-Id": clientId ?? "", Authorization: `Bearer ${await appToken()}` },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 401 || res.status === 403)
        throw new TwitchError("Twitch refused (401/403). Check credentials.");
    if (!res.ok)
        throw new TwitchError(`Twitch error ${res.status}`);
    return (await res.json());
}
export async function topGames(limit = 10) {
    const data = await helix(`/games/top?first=${Math.min(Math.max(limit, 1), 100)}`);
    return (data.data ?? []).slice(0, limit).map((g) => ({ id: String(g.id), name: String(g.name) }));
}
export async function topStreams(gameId = "", limit = 10) {
    const qs = new URLSearchParams({ first: String(Math.min(Math.max(limit, 1), 100)) });
    if (gameId.trim())
        qs.set("game_id", gameId.trim());
    const data = await helix(`/streams?${qs}`);
    return (data.data ?? []).slice(0, limit).map((s) => ({
        user: String(s.user_name ?? s.user_login ?? "?"),
        game: s.game_name,
        title: s.title,
        viewers: s.viewer_count,
        language: s.language,
    }));
}
export async function getUser(login) {
    if (!login.trim())
        throw new TwitchError("Login is empty.");
    const data = await helix(`/users?login=${encodeURIComponent(login.trim())}`);
    const u = (data.data ?? [])[0];
    if (!u)
        return null;
    return {
        id: String(u.id),
        login: String(u.login),
        name: u.display_name,
        broadcasterType: u.broadcaster_type || undefined,
        description: u.description ? String(u.description).slice(0, 200) : undefined,
    };
}
export function formatStream(s, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    return `${prefix}${s.user}${s.game ? ` playing ${s.game}` : ""}${s.viewers !== undefined ? ` (${s.viewers.toLocaleString()} viewers)` : ""}${s.title ? `\n   ${s.title.slice(0, 120)}` : ""}`;
}
export function formatUser(u) {
    return `[${u.id}] ${u.name ?? u.login} (@${u.login})${u.broadcasterType ? ` — ${u.broadcasterType}` : ""}${u.description ? `\n${u.description}` : ""}`;
}
// ---- muxH tools:
// The three tools above all call Twitch's Helix API, which needs a client id and
// secret. These two need no credentials: one reads Twitch's own public status
// record, component by component, and the other asks Steam's public charts and
// SteamSpy what is actually being played right now, which is the question behind
// most streaming decisions.
const TW_STATUS = "https://status.twitch.tv/api/v2";
const TW_UA = "mcfentmen-twitch-mcp/1.1 (https://github.com/mcfentmen/twitch-mcp)";
async function twGet(url, label) {
    let res;
    try {
        res = await fetch(url, { headers: { "User-Agent": TW_UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) });
    }
    catch (e) {
        throw new TwitchError(`Could not reach ${label}: ${e.message}`);
    }
    if (!res.ok)
        throw new TwitchError(`${label} returned HTTP ${res.status}.`);
    return (await res.json());
}
const twClean = (raw) => String(raw ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
const TW_CHART = "https://api.steampowered.com/ISteamChartsService/GetMostPlayedGames/v1/";
const TW_APP = "https://store.steampowered.com/api/appdetails";
const TW_SPY = "https://steamspy.com/api.php";
const TW_REVIEWS = "https://store.steampowered.com/appreviews/";
async function twSteamApp(appId) {
    try {
        const res = await fetch(`${TW_APP}?appids=${encodeURIComponent(appId)}&l=english`, {
            headers: { "User-Agent": TW_UA, Accept: "application/json" },
            signal: AbortSignal.timeout(25000),
        });
        if (!res.ok)
            return null;
        const body = (await res.json());
        const entry = body?.[appId];
        return entry?.success ? entry.data ?? null : null;
    }
    catch {
        return null;
    }
}
async function twSteamSpy(appId) {
    try {
        const res = await fetch(`${TW_SPY}?request=appdetails&appid=${encodeURIComponent(appId)}`, {
            headers: { "User-Agent": TW_UA, Accept: "application/json" },
            signal: AbortSignal.timeout(25000),
        });
        if (!res.ok)
            return null;
        const body = (await res.json());
        return body?.error ? null : body;
    }
    catch {
        return null;
    }
}
async function twSteamReviews(appId) {
    try {
        const res = await fetch(`${TW_REVIEWS}${encodeURIComponent(appId)}?json=1&language=all&purchase_type=all&num_per_page=0`, {
            headers: { "User-Agent": TW_UA, Accept: "application/json" },
            signal: AbortSignal.timeout(25000),
        });
        if (!res.ok)
            return null;
        const body = (await res.json());
        return body?.success ? body.query_summary ?? null : null;
    }
    catch {
        return null;
    }
}
const twNum = (n) => (Number.isFinite(Number(n)) ? Number(n).toLocaleString("en-US") : "not reported");
/**
 * The demand side of a streaming decision, from Steam's weekly most-played chart
 * enriched per title. Twitch tells you who is watching; this tells you what they
 * are already playing.
 */
export async function gameDemand(args) {
    const limit = Math.round(Math.min(Math.max(Number(args?.limit ?? 6) || 6, 1), 12));
    const chart = await twGet(TW_CHART, "Steam's most-played chart");
    const response = chart?.response ?? {};
    const ranks = Array.isArray(response.ranks) ? response.ranks : [];
    if (!ranks.length)
        throw new TwitchError("Steam's chart came back with no ranks; the endpoint publishes a weekly rollup and can be briefly empty while it recalculates.");
    const rollup = response.rollup_date ? new Date(response.rollup_date * 1000).toISOString().slice(0, 10) : "date not reported";
    const picked = ranks.slice(0, limit);
    const rows = [
        `Steam's most-played chart, rollup ${rollup} — top ${picked.length} of ${ranks.length} ranked title(s)`, "",
        "  rank  last  move   peak this week   playing now   title",
    ];
    const enriched = [];
    for (const entry of picked) {
        const appId = String(entry.appid ?? "");
        if (!/^\d+$/.test(appId))
            continue;
        const app = await twSteamApp(appId);
        const spy = await twSteamSpy(appId);
        const reviews = await twSteamReviews(appId);
        const last = Number(entry.last_week_rank ?? 0);
        const rank = Number(entry.rank ?? 0);
        const move = last > 0 ? last - rank : null;
        const moveLabel = move === null ? "new" : move === 0 ? "=" : move > 0 ? `up ${move}` : `down ${-move}`;
        const title = app?.name ?? spy?.name ?? `app ${appId}`;
        rows.push(`  ${String(rank).padStart(4)}  ${String(last || "-").padStart(4)}  ${moveLabel.padEnd(5)}  ${twNum(entry.peak_in_game).padStart(15)}  ${twNum(spy?.ccu).padStart(12)}   ${title}`);
        const positive = reviews?.total_positive ?? spy?.positive;
        const negative = reviews?.total_negative ?? spy?.negative;
        const totalReviews = Number(reviews?.total_reviews ?? (Number(positive) + Number(negative)));
        const split = totalReviews > 0 ? `${((Number(positive) / totalReviews) * 100).toFixed(1)}% positive of ${twNum(totalReviews)}` : "no reviews published";
        const genres = (app?.genres ?? []).map((g) => g.description).filter(Boolean);
        const price = app?.is_free ? "free" : app?.price_overview ? `${(app.price_overview.final / 100).toFixed(2)} ${app.price_overview.currency}` : "price not reported";
        rows.push(`        ${genres.length ? genres.join(", ") : "genre not reported"} | ${(app?.developers ?? []).join(", ") || "developer not reported"} | ${price} | owners ${spy?.owners ?? "estimate unavailable"} | ${split}`);
        enriched.push({ title, rank, move, peak: Number(entry.peak_in_game) });
    }
    const movers = enriched.filter((e) => e.move !== null && e.move !== 0);
    const risers = movers.filter((e) => e.move > 0).sort((a, b) => b.move - a.move);
    const fallers = movers.filter((e) => e.move < 0).sort((a, b) => a.move - b.move);
    rows.push("");
    rows.push(`This week: ${risers.length} riser(s), ${fallers.length} faller(s), ${enriched.filter((e) => e.move === null).length} new to the chart.`);
    if (risers.length)
        rows.push(`  biggest riser  ${risers[0].title} — ${risers[0].move} place(s) to #${risers[0].rank}`);
    if (fallers.length)
        rows.push(`  biggest faller ${fallers[0].title} — ${-fallers[0].move} place(s) to #${fallers[0].rank}`);
    rows.push("", "note: rank and the weekly peak are Valve's own chart; 'playing now' and the ownership bracket are SteamSpy estimates taken at the time of the call, so the two do not share a clock. The chart ranks by peak concurrent players in the week, which rewards a big launch and hides a game with a steady smaller audience.");
    return rows.join("\n");
}
const twStatusWord = (raw) => {
    const key = String(raw ?? "").toLowerCase();
    if (key === "operational")
        return "operational";
    if (key.includes("degraded"))
        return "degraded performance";
    if (key.includes("outage"))
        return "major outage";
    if (key.includes("maintenance"))
        return "under maintenance";
    if (key.includes("partial"))
        return "partial outage";
    return raw ? raw.replace(/_/g, " ") : "state not reported";
};
/**
 * Whether Twitch itself is up, component by component: login, web, chat, watching,
 * broadcasting and purchases each with their published state, plus anything open
 * right now. Worth checking before blaming a stream for not going out.
 */
export async function serviceStatus() {
    // status.json carries only the indicator, so the component list comes from its own endpoint.
    const [current, componentList, incidents] = await Promise.all([
        twGet(`${TW_STATUS}/status.json`, "Twitch's status service"),
        twGet(`${TW_STATUS}/components.json`, "Twitch's status service"),
        twGet(`${TW_STATUS}/incidents.json`, "Twitch's status service"),
    ]);
    const components = componentList.components ?? [];
    const page = current.page ?? componentList.page ?? {};
    const indicator = current.status?.indicator ?? "not reported";
    const description = current.status?.description ?? "not reported";
    if (!components.length && !current.status) {
        throw new TwitchError("Twitch's status service returned neither a status nor any components.");
    }
    const all = incidents.incidents ?? [];
    const open = all.filter((i) => i.status !== "resolved");
    const recent = all.slice(0, 5);
    const byImpact = new Map();
    for (const incident of all) {
        const key = incident.impact ?? "not reported";
        byImpact.set(key, (byImpact.get(key) ?? 0) + 1);
    }
    const openComponents = new Set();
    for (const incident of open)
        for (const c of incident.components ?? [])
            if (c.name)
                openComponents.add(c.name);
    return [
        `Twitch service status`,
        `  overall: ${String(indicator).toUpperCase()} — ${description}`,
        `  page ${page.name ?? "Twitch"} last updated ${page.updated_at ?? "not reported"} (${page.time_zone ?? "timezone not reported"})`,
        `  ${components.length} component(s) published`,
        "",
        "Components:",
        ...components.map((c) => `  ${String(c.name ?? "?").padEnd(22)} ${twStatusWord(c.status).padEnd(20)} ${openComponents.has(c.name ?? "") ? "<- named in an open incident" : ""}  updated ${String(c.updated_at ?? "not reported").slice(0, 16).replace("T", " ")}`),
        "",
        open.length
            ? `Open right now: ${open.length} incident(s) not resolved`
            : "Open right now: no unresolved incident in the published record",
        ...open.slice(0, 4).map((i) => `  - ${i.name ?? "untitled"} (${i.status ?? "status not reported"}, impact ${i.impact ?? "not reported"}) since ${String(i.created_at ?? "").slice(0, 16).replace("T", " ")}` +
            `${(i.components ?? []).map((c) => c.name).join(", ") ? ` | components: ${(i.components ?? []).map((c) => c.name).join(", ")}` : ""}`),
        "",
        `Most recent resolved incidents of ${all.length} published: ${[...byImpact.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${n} ${k}`).join(", ")} by impact`,
        ...recent.map((i) => `  - ${String(i.created_at ?? "").slice(0, 10)} ${(i.name ?? "untitled").slice(0, 68)} (${i.impact ?? "?"})` +
            `${(i.components ?? []).length ? ` | ${(i.components ?? []).map((c) => c.name).join(", ")}` : ""}`),
        "",
        "This is Twitch's public status page, which reports problems above its own internal threshold. A component marked operational means Twitch is not currently reporting a fault against it, not that a given stream or account has no problem; anything below Twitch's reporting threshold never appears here.",
    ].join("\n");
}
