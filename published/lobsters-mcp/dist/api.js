const BASE = "https://lobste.rs";
const UA = "mrfentmen-lobsters-mcp/1.0 (https://github.com/mrfentmen)";
export class LobstersError extends Error {
}
async function get(url) {
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) });
    if (!res.ok)
        throw new LobstersError(`Lobsters error ${res.status}`);
    return (await res.json());
}
function fmt(rows, limit) {
    return rows.slice(0, limit).map((s, i) => `${i + 1}. ${s.title ?? ""} (${s.score ?? 0} pts, ${s.comment_count ?? 0} comments)\n   ${s.url ?? `https://lobste.rs/s/${s.short_id ?? ""}`}`).join("\n\n") || "No stories";
}
export async function newest(args) {
    const limit = Math.min(args.limit ?? 10, 25);
    const rows = await get(`${BASE}/newest.json?limit=${limit}`);
    return `Newest on Lobsters\n${fmt(rows, limit)}`;
}
export async function top(args) {
    const limit = Math.min(args.limit ?? 10, 25);
    const rows = await get(`${BASE}/top.json?limit=${limit}`);
    return `Top on Lobsters\n${fmt(rows, limit)}`;
}
// ---- muxB tools:
const lobstersText = (row, key, fallback = "not reported") => {
    const value = row?.[key];
    return value != null && String(value) !== "" ? String(value) : fallback;
};
const lobstersBody = (html, max = 400) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
export async function story(args) {
    const id = (args.id ?? "").trim();
    if (!id)
        throw new LobstersError("Provide a story id, e.g. \"hq6xj2\".");
    const commentLimit = Math.max(0, Math.min(args.commentLimit ?? 8, 40));
    const s = await get(`${BASE}/s/${encodeURIComponent(id)}.json`);
    const tags = Array.isArray(s.tags) ? s.tags : [];
    const lines = [
        `Lobsters story ${s.short_id ?? id}`,
        `Title: ${lobstersText(s, "title", "(untitled)")}`,
        `URL: ${lobstersText(s, "url")}`,
        `Discussion: ${lobstersText(s, "comments_url")}`,
        `By: ${lobstersText(s, "submitter_user")} at ${lobstersText(s, "created_at")}`,
        `Score: ${lobstersText(s, "score", "0")} | comments: ${lobstersText(s, "comment_count", "0")} | flags: ${lobstersText(s, "flags", "0")}`,
        `Tags: ${tags.length ? tags.join(", ") : "none"}`,
    ];
    const body = lobstersBody(lobstersText(s, "description_plain", ""));
    if (body)
        lines.push("", body);
    const comments = Array.isArray(s.comments) ? s.comments : [];
    if (comments.length) {
        lines.push("", `Comments (${Math.min(comments.length, commentLimit)} of ${comments.length} shown):`);
        for (const c of comments.slice(0, commentLimit)) {
            const indent = "  ".repeat(Math.max(0, Math.min(Number(c.depth ?? 0), 4) + 1));
            lines.push(`${indent}- ${lobstersText(c, "commenting_user", "unknown")} (${lobstersText(c, "created_at")}): ${lobstersBody(lobstersText(c, "comment_plain", ""), 300)}`);
        }
    }
    else {
        lines.push("", "No comments on this story yet.");
    }
    return lines.join("\n");
}
