/**
 * 4chan client — the read-only JSON API on a.4cdn.org (no key).
 * Docs: https://github.com/4chan/4chan-API
 * JSON mirrors the HTML: posts are objects with numeric keys; `com` is
 * HTML that we flatten for display.
 */
const BASE = "https://a.4cdn.org";
export class ChanError extends Error {
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { Accept: "application/json", "User-Agent": "fourchan-mcp/1.0" },
    });
    if (res.status === 404)
        throw new ChanError(`4chan: nothing at ${path} (bad board or thread)`);
    if (!res.ok)
        throw new ChanError(`4chan API error ${res.status}: ${res.statusText}`);
    return (await res.json());
}
// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------
export async function listBoards() {
    const d = await getJson("/boards.json");
    return (d.boards ?? []).map((b) => ({
        board: b.board ?? "",
        title: b.title ?? "?",
        sfw: !!b.is_worksafe,
        description: b.meta_description,
    }));
}
export async function getCatalog(board) {
    const pages = await getJson(`/${encodeURIComponent(board)}/catalog.json`);
    const threads = [];
    for (const page of pages) {
        for (const t of page.threads ?? []) {
            threads.push({
                no: t.no ?? 0,
                sub: t.sub,
                com: t.com ? stripHtml(t.com) : undefined,
                replies: t.replies ?? 0,
                images: t.images ?? 0,
                lastModified: t.last_modified,
            });
        }
    }
    return threads;
}
export async function getThread(board, threadNo) {
    const d = await getJson(`/${encodeURIComponent(board)}/thread/${threadNo}.json`);
    return (d.posts ?? []).map((p) => ({
        no: p.no ?? 0,
        com: p.com ? stripHtml(p.com) : undefined,
        name: p.name,
        time: p.time,
        replies: p.replies,
        images: p.images,
        filename: p.filename ? `${p.filename}${p.ext ?? ""}` : undefined,
        tim: p.tim,
        ext: p.ext,
        w: p.w,
        h: p.h,
    }));
}
// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------
function stripHtml(s) {
    return s
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#039;/g, "'")
        .replace(/&nbsp;/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}
export function fmtChanTime(ts) {
    if (!ts)
        return "";
    return new Date(ts * 1000).toISOString().replace("T", " ").slice(0, 16) + " UTC";
}
export function formatThreadSummary(t, index) {
    const lines = [
        `${index + 1}. [${t.no}] ${t.sub ?? "(no subject)"} — ${t.replies} replies / ${t.images} img`,
        t.com ? t.com.slice(0, 200) : "",
    ].filter(Boolean);
    return lines.join("\n");
}
export function formatPost(p) {
    const img = p.filename ? ` [img: ${p.filename}]` : "";
    return `#${p.no}${p.name ? ` by ${p.name}` : ""}${fmtChanTime(p.time)}${img}\n${p.com ?? "(no text)"}`;
}
