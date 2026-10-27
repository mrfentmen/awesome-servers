/**
 * Arctic Shift (Reddit archive) API client, keyless.
 * Docs: https://arctic-shift.photon-reddit.com/
 * Reddit's own public JSON blocks datacenter IPs, so this server reads
 * the open Arctic Shift archive instead. No credentials required.
 */
const BASE = "https://arctic-shift.photon-reddit.com/api";
export class RedditError extends Error {
}
async function getJson(path, params) {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE}${path}?${qs}`, {
        headers: { "User-Agent": "reddit-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new RedditError(`Arctic Shift error ${res.status}`);
    return (await res.json());
}
const fmtDate = (ts) => typeof ts === "number" ? new Date(ts * 1000).toISOString().slice(0, 10) : undefined;
export async function searchPosts(subreddit, query, sort = "newest", limit = 5) {
    const params = { limit: String(Math.min(Math.max(limit, 1), 100)), sort: sort === "oldest" ? "asc" : "desc" };
    if (subreddit.trim())
        params.subreddit = subreddit.trim();
    if (query.trim())
        params.query = query.trim();
    const data = await getJson("/posts/search", params);
    return (data.data ?? []).slice(0, limit).map((p) => ({
        id: p.id,
        title: String(p.title ?? "(no title)"),
        author: p.author,
        subreddit: p.subreddit,
        score: typeof p.score === "number" ? p.score : undefined,
        comments: typeof p.num_comments === "number" ? p.num_comments : undefined,
        created: fmtDate(p.created_utc),
        url: p.permalink ? `https://www.reddit.com${p.permalink}` : undefined,
        text: p.selftext ? String(p.selftext).slice(0, 400) : undefined,
    }));
}
export async function searchComments(subreddit, query, limit = 5) {
    const params = { limit: String(Math.min(Math.max(limit, 1), 100)) };
    if (subreddit.trim())
        params.subreddit = subreddit.trim();
    if (query.trim())
        params.query = query.trim();
    const data = await getJson("/comments/search", params);
    return (data.data ?? []).slice(0, limit).map((c) => ({
        author: c.author,
        subreddit: c.subreddit,
        score: typeof c.score === "number" ? c.score : undefined,
        created: fmtDate(c.created_utc),
        body: String(c.body ?? "").slice(0, 400),
    }));
}
export function formatPost(p, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    const meta = [
        p.author ? `u/${p.author}` : "",
        p.subreddit ? `r/${p.subreddit}` : "",
        p.score !== undefined ? `${p.score}↑` : "",
        p.comments !== undefined ? `${p.comments} comments` : "",
        p.created ?? "",
    ].filter(Boolean).join(" · ");
    const lines = [`${prefix}${p.title}`, meta, p.text ? `${p.text}` : "", p.url ? `${p.url}` : ""].filter(Boolean);
    return lines.join("\n");
}
export function formatComment(c, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    const meta = [c.author ? `u/${c.author}` : "", c.subreddit ? `r/${c.subreddit}` : "", c.score !== undefined ? `${c.score}↑` : ""].filter(Boolean).join(" · ");
    return `${prefix}${c.body}${meta ? `\n— ${meta}` : ""}`;
}
export async function userPosts(author, limit = 5) {
    if (!author.trim())
        throw new RedditError("Provide a username.");
    const data = await getJson("/posts/search", { author: author.trim(), limit: String(Math.min(Math.max(limit, 1), 100)), sort: "desc" });
    return (data.data ?? []).slice(0, limit).map((p) => ({
        id: p.id,
        title: String(p.title ?? "(no title)"),
        author: p.author,
        subreddit: p.subreddit,
        score: typeof p.score === "number" ? p.score : undefined,
        comments: typeof p.num_comments === "number" ? p.num_comments : undefined,
        created: fmtDate(p.created_utc),
        url: p.permalink ? `https://www.reddit.com${p.permalink}` : undefined,
        text: p.selftext ? String(p.selftext).slice(0, 400) : undefined,
    }));
}
export async function subredditPosts(subreddit, sort = "newest", limit = 5) {
    if (!subreddit.trim())
        throw new RedditError("Provide a subreddit.");
    return searchPosts(subreddit, "", sort, limit);
}
