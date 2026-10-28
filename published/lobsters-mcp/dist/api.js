const BASE = "https://lobste.rs";
export class LobstersError extends Error {
}
async function getJson(path, timeoutMs = 20000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(`${BASE}${path}`, {
            signal: ctrl.signal,
            headers: { "user-agent": "lobsters-mcp", accept: "application/json" },
        });
        if (res.status === 404)
            throw new LobstersError("Not found on lobste.rs");
        if (res.status === 403)
            throw new LobstersError("lobste.rs refused the request");
        if (!res.ok)
            throw new LobstersError(`lobste.rs responded ${res.status}`);
        return await res.json();
    }
    catch (e) {
        if (e instanceof LobstersError)
            throw e;
        if (e.name === "AbortError")
            throw new LobstersError("lobste.rs request timed out");
        if (e instanceof SyntaxError)
            throw new LobstersError("lobste.rs returned a non-JSON response");
        throw new LobstersError(`lobste.rs request failed: ${e.message}`);
    }
    finally {
        clearTimeout(timer);
    }
}
function toStory(s) {
    const user = typeof s.submitter_user === "object" ? s.submitter_user?.username : s.submitter_user;
    return {
        short_id: String(s.short_id ?? ""),
        title: String(s.title ?? "(untitled)"),
        url: String(s.url ?? ""),
        score: Number(s.score ?? 0),
        comment_count: Number(s.comment_count ?? 0),
        created_at: String(s.created_at ?? "").slice(0, 16).replace("T", " "),
        submitter_user: String(user ?? "unknown"),
        tags: Array.isArray(s.tags) ? s.tags.map(String) : [],
        description: String(s.description_plain ?? s.description ?? "").replace(/\s+/g, " ").slice(0, 200),
    };
}
function line(s, i) {
    const prefix = typeof i === "number" ? `${i + 1}. ` : "• ";
    const where = s.url ? s.url : `${BASE}/s/${s.short_id}`;
    return `${prefix}${s.title} [${s.score} pts, ${s.comment_count} comments]\n   ${where}\n   ${s.tags.join(", ") || "no tags"} · ${s.submitter_user} · ${s.created_at}`;
}
function take(rows, limit) {
    return rows.slice(0, limit).map(toStory);
}
export async function hottest(limit) {
    const rows = await getJson("/hottest.json");
    const stories = take(Array.isArray(rows) ? rows : [], limit);
    if (stories.length === 0)
        return "lobste.rs returned no stories.";
    return [`lobste.rs hottest (${stories.length}):`, "", ...stories.map(line)].join("\n");
}
export async function newest(limit) {
    const rows = await getJson("/newest.json");
    const stories = take(Array.isArray(rows) ? rows : [], limit);
    if (stories.length === 0)
        return "lobste.rs returned no stories.";
    return [`lobste.rs newest (${stories.length}):`, "", ...stories.map(line)].join("\n");
}
export async function byTag(tag, limit) {
    const t = tag.trim().toLowerCase();
    if (!/^[a-z0-9_-]{2,30}$/.test(t))
        throw new LobstersError(`"${tag}" is not a valid tag`);
    const rows = await getJson(`/t/${encodeURIComponent(t)}.json`);
    const stories = take(Array.isArray(rows) ? rows : [], limit);
    if (stories.length === 0)
        return `No stories tagged "${tag}".`;
    return [`Stories tagged "${tag}" (${stories.length}):`, "", ...stories.map(line)].join("\n");
}
export async function storyDetail(shortId) {
    const id = shortId.trim().toLowerCase();
    if (!/^[a-z0-9]{4,12}$/.test(id))
        throw new LobstersError(`"${shortId}" is not a story id`);
    const s = toStory(await getJson(`/s/${id}.json`));
    const rows = [
        `${s.title}`,
        `Score ${s.score} · ${s.comment_count} comments · ${s.created_at} · by ${s.submitter_user}`,
        `Tags: ${s.tags.join(", ") || "none"}`,
        s.url ? `Link: ${s.url}` : "Self post",
        `Discussion: ${BASE}/s/${s.short_id}`,
    ];
    if (s.description)
        rows.push("", s.description);
    return rows.join("\n");
}
export async function userInfo(username) {
    const u = username.trim();
    if (!/^[A-Za-z0-9_-]{2,30}$/.test(u))
        throw new LobstersError(`"${username}" is not a valid username`);
    const d = await getJson(`/~${encodeURIComponent(u)}.json`);
    const profile = d.user ?? d;
    // lobste.rs exposes identity fields only — no karma or story counts.
    const roles = [profile.is_admin ? "admin" : "", profile.is_moderator ? "moderator" : ""].filter(Boolean);
    return [
        `User: ${profile.username ?? u}`,
        `Joined: ${String(profile.created_at ?? d.created_at ?? "").slice(0, 10) || "unknown"}`,
        `Role: ${roles.join(", ") || "member"}`,
        `Invited by: ${profile.invited_by_user ?? "unknown"}`,
        `GitHub: ${profile.github_username ?? "not linked"} · Mastodon: ${profile.mastodon_username ?? "not linked"}`,
        `About: ${String(profile.about ?? d.about ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500) || "no bio"}`,
    ].join("\n");
}
export async function domainBreakdown(limit) {
    const rows = await getJson("/hottest.json");
    const stories = take(Array.isArray(rows) ? rows : [], 100);
    if (stories.length === 0)
        return "lobste.rs returned no stories.";
    const counts = new Map();
    for (const s of stories) {
        let host = "self post";
        try {
            host = s.url ? new URL(s.url).hostname.replace(/^www\./, "") : "self post";
        }
        catch {
            host = "unknown";
        }
        counts.set(host, (counts.get(host) ?? 0) + 1);
    }
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
    const tags = new Map();
    for (const s of stories)
        for (const t of s.tags)
            tags.set(t, (tags.get(t) ?? 0) + 1);
    const topTags = [...tags.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    return [
        `Domains on the hottest page (${stories.length} stories):`,
        "",
        ...top.map(([host, n], i) => `${i + 1}. ${host} — ${n}`),
        "",
        `Active tags: ${topTags.map(([t, n]) => `${t} (${n})`).join(", ")}`,
    ].join("\n");
}
