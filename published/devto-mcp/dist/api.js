const BASE = "https://dev.to/api";
const UA = "mrfentmen-devto-mcp/1.0 (https://github.com/mrfentmen)";
export class DevtoError extends Error {
}
async function get(url) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/vnd.forem.api-v1+json" }, signal: AbortSignal.timeout(20000) });
    if (res.status === 429)
        throw new DevtoError("dev.to rate limit hit, wait and retry");
    if (!res.ok)
        throw new DevtoError(`dev.to error ${res.status}`);
    return (await res.json());
}
function fmt(a, i) {
    const tags = (a?.tag_list ?? []).join(", ");
    return `${i + 1}. ${a?.title ?? "Untitled"}\n   ${tags || "no tags"} | ${a?.positive_reactions_count ?? 0} reactions | ${a?.comments_count ?? 0} comments\n   by ${a?.user?.name ?? "n/a"} | ${a?.url ?? ""}`;
}
export async function latestArticles(args) {
    const limit = Math.min(args.limit ?? 10, 30);
    const d = await get(`${BASE}/articles?per_page=${limit}`);
    if (!d?.length)
        return "No articles";
    return d.map(fmt).join("\n\n");
}
export async function searchArticles(args) {
    const q = (args.query ?? "").trim();
    if (!q)
        throw new DevtoError("Provide search terms");
    const limit = Math.min(args.limit ?? 10, 30);
    const d = await get(`${BASE}/articles?per_page=${limit}&tag=${encodeURIComponent(q)}`);
    if (!d?.length)
        return `No articles for ${q}`;
    return d.map(fmt).join("\n\n");
}
export async function articleDetails(args) {
    const id = Number(args.id);
    if (!Number.isInteger(id) || id <= 0)
        throw new DevtoError("Provide a numeric article id");
    const d = await get(`${BASE}/articles/${id}`);
    return `${d?.title ?? "Untitled"}\nby ${d?.user?.name ?? "n/a"} | ${d?.positive_reactions_count ?? 0} reactions | ${d?.comments_count ?? 0} comments\nTags: ${(d?.tags ?? d?.tag_list ?? []).join?.(", ") ?? ""}\n${d?.url ?? ""}\n\n${String(d?.body_markdown ?? d?.description ?? "").slice(0, 800)}`;
}
export async function userArticles(args) {
    const u = (args.username ?? "").trim();
    if (!u)
        throw new DevtoError("Provide a username");
    const limit = Math.min(args.limit ?? 10, 30);
    const d = await get(`${BASE}/articles?username=${encodeURIComponent(u)}&per_page=${limit}`);
    if (!d?.length)
        return `No articles by ${u}`;
    return d.map(fmt).join("\n\n");
}
export async function tagList(args) {
    const limit = Math.min(args.limit ?? 10, 30);
    const d = await get(`${BASE}/tags?per_page=${limit}`);
    if (!d?.length)
        return "No tags";
    return d.map((t, i) => `${i + 1}. ${t.name ?? "?"} (following ${t.followers_count ?? "?"})`).join("\n");
}
export async function videos(args) {
    const limit = Math.min(args.limit ?? 10, 30);
    const d = await get(`${BASE}/videos?per_page=${limit}`);
    if (!d?.length)
        return "No videos";
    return d.map((v, i) => `${i + 1}. ${v.title ?? "?"} | ${v.video_duration_in_minutes ?? "?"} min\n   by ${v.user?.name ?? "n/a"} | ${v.url ?? ""}`).join("\n\n");
}
export async function podcasts(args) {
    const limit = Math.min(args.limit ?? 10, 30);
    const d = await get(`${BASE}/podcast_episodes?per_page=${limit}`);
    if (!d?.length)
        return "No podcast episodes";
    return d.map((p, i) => `${i + 1}. ${p.title ?? "?"} | ${p.podcast_title ?? "?"}\n   ${p.url ?? ""}`).join("\n\n");
}
export async function topArticles(args) {
    const days = [1, 7, 30, 365, 100000].includes(Number(args.days)) ? Number(args.days) : 7;
    const limit = Math.min(args.limit ?? 10, 30);
    const d = await get(`${BASE}/articles?top=${days}&per_page=${limit}`);
    if (!d?.length)
        return "No articles";
    return d.map(fmt).join("\n\n");
}
