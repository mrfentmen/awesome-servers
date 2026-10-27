/**
 * Hacker News client. Keyless. Firebase for live lists and items, Algolia for
 * full-text search with points and comment counts.
 */
const FB = "https://hacker-news.firebaseio.com/v0";
const ALGOLIA = "https://hn.algolia.com/api/v1";
export class HnError extends Error {
}
async function get(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": "hackernews-mcp/1.0 (awesome-servers)" },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new HnError(`HN error ${res.status}`);
    return (await res.json());
}
export async function ids(kind, limit) {
    const all = await get(`${FB}/${kind}.json`);
    return (all ?? []).slice(0, limit);
}
export async function item(id) {
    const it = await get(`${FB}/item/${id}.json`);
    return it ?? undefined;
}
export async function user(id) {
    const u = await get(`${FB}/user/${encodeURIComponent(id)}.json`);
    return u ?? undefined;
}
export async function search(query, tags, limit) {
    const url = `${ALGOLIA}/search?query=${encodeURIComponent(query)}&tags=${encodeURIComponent(tags)}&hitsPerPage=${limit}`;
    const body = await get(url);
    return body.hits ?? [];
}
export function itemText(it) {
    const when = it.time ? new Date(it.time * 1000).toISOString() : "?";
    const body = (it.text ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    return [
        `#${it.id} ${it.title ?? "(comment)"} [${it.type ?? "?"}]`,
        `by ${it.by ?? "?"} at ${when} | score ${it.score ?? 0} | comments ${it.descendants ?? 0}`,
        it.url ? `link: ${it.url}` : "",
        body ? `\n${body.slice(0, 800)}` : "",
    ]
        .filter(Boolean)
        .join("\n");
}
export function hitText(h) {
    const n = h.num_comments ?? 0;
    const p = h.points ?? 0;
    const url = h.url ?? `https://news.ycombinator.com/item?id=${h.objectID}`;
    const title = h.title ?? (h.story_text ?? h.comment_text ?? "").replace(/<[^>]+>/g, "").slice(0, 80);
    return `${title} — ${p} points, ${n} comments, ${h.created_at ?? ""}\n  ${url}`;
}
