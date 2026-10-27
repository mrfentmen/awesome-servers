const BASE = 'https://public.api.bsky.app/xrpc/app.bsky.actor.searchActors';
export async function search(args) {
    const q = (args.query ?? '').trim();
    if (!q)
        return 'Provide search terms.';
    const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
    const params = new URLSearchParams({ q, limit: String(limit) });
    const res = await fetch(`${BASE}?${params.toString()}`, {
        headers: { 'User-Agent': 'mrfentmen-bluesky-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Bluesky returned ${res.status}`);
    const d = (await res.json());
    const rows = d.actors ?? [];
    if (!rows.length)
        return `No Bluesky actors found for "${q}".`;
    return `Bluesky actors for "${q}" (${rows.length} shown):\n` +
        rows
            .map((r, i) => {
            const s = (k) => (r[k] != null ? String(r[k]) : '');
            return `${i + 1}. ${s('handle')}${s('displayName') ? ` | ${s('displayName')}` : ''}${s('description') ? ` | ${s('description').slice(0, 80)}` : ''}`;
        })
            .join('\n');
}
// ---- muxA tools:
const API = 'https://public.api.bsky.app/xrpc';
function bound(value, fallback, max) {
    return Math.max(1, Math.min(Math.round(value ?? fallback), max));
}
function clean(value) {
    return value != null ? String(value) : '';
}
async function bsky(method, params) {
    const search = new URLSearchParams(params);
    const res = await fetch(`${API}/${method}?${search.toString()}`, {
        headers: { 'User-Agent': 'mrfentmen-bluesky-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 400)
        throw new Error(`Bluesky rejected ${method}: ${(await res.text()).slice(0, 120)}`);
    if (!res.ok)
        throw new Error(`Bluesky returned ${res.status} for ${method}`);
    return (await res.json());
}
/** One post reduced to the lines worth printing. */
function postLine(post, index) {
    const author = post?.author ?? {};
    const head = `${index !== undefined ? `${index + 1}. ` : ''}${clean(post?.record?.text).slice(0, 280) || 'no text'}`;
    const meta = [
        `@${clean(author.handle) || 'unknown'}`,
        clean(post?.record?.createdAt).slice(0, 10) || 'date not reported',
        post?.replyCount != null ? `${post.replyCount} replies` : '',
        post?.likeCount != null ? `${post.likeCount} likes` : '',
        post?.repostCount != null ? `${post.repostCount} reposts` : '',
        post?.quoteCount != null ? `${post.quoteCount} quotes` : '',
    ]
        .filter(Boolean)
        .join(' | ');
    return `${head}\n   ${meta}`;
}
export async function actorPosts(args) {
    const actor = (args.actor ?? '').trim();
    if (!actor)
        return 'Provide an actor handle or DID, e.g. bsky.app.';
    const limit = bound(args.limit, 10, 50);
    const d = await bsky('app.bsky.feed.getAuthorFeed', {
        actor,
        limit: String(limit),
    });
    const feed = d.feed ?? [];
    if (!feed.length)
        return `Bluesky returned no posts for ${actor}.`;
    return `Recent posts by ${actor} (${feed.length} shown):\n` +
        feed.map((f, i) => postLine(f.post ?? {}, i)).join('\n');
}
