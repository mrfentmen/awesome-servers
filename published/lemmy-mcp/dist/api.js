const BASE = 'https://lemmy.world/api/v3/community/list';
export async function communities(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 10, 30));
    const params = new URLSearchParams({
        limit: String(limit),
        sort: 'TopAll',
        type_: 'All',
    });
    const res = await fetch(`${BASE}?${params.toString()}`, {
        headers: { 'User-Agent': 'mrfentmen-lemmy-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Lemmy returned ${res.status}`);
    const d = (await res.json());
    const rows = d.communities ?? [];
    if (!rows.length)
        return 'No communities returned.';
    return `Top Lemmy communities on lemmy.world (${rows.length} shown):\n` +
        rows
            .map((r, i) => {
            const c = (r.community && typeof r.community === 'object' ? r.community : {});
            const s = (k) => (c[k] != null ? String(c[k]) : '');
            const subs = r.counts && typeof r.counts === 'object' ? r.counts.subscribers : undefined;
            return `${i + 1}. ${s('name')}${s('title') ? ` | ${s('title')}` : ''}${subs ? ` | subscribers ${subs}` : ''}`;
        })
            .join('\n');
}
// ---- muxC tools:
const LEMMY_BASE = "https://lemmy.world/api/v3";
const LEMMY_UA = "mrfentmen-lemmy-mcp/1.0";
class LemmyLookupError extends Error {
}
async function lemmyGet(path) {
    const res = await fetch(`${LEMMY_BASE}${path}`, {
        headers: { "User-Agent": LEMMY_UA, Accept: "application/json" },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new LemmyLookupError(`lemmy.world returned HTTP ${res.status}`);
    return (await res.json());
}
function object(value) {
    return value && typeof value === "object" ? value : {};
}
// ---- gap4c1 tools:
function lemmyField(value, max = 200) {
    return value == null || value === '' ? 'not reported' : String(value).replace(/\s+/g, ' ').slice(0, max);
}
export async function searchCommunities(args) {
    const query = args.query.trim();
    if (!query)
        throw new LemmyLookupError('Provide a search query.');
    const limit = Math.max(1, Math.min(Math.round(args.limit ?? 5), 20));
    const params = new URLSearchParams({ q: query, type_: 'Communities', limit: String(limit) });
    const data = await lemmyGet(`/search?${params}`);
    const rows = (data.communities ?? []).slice(0, limit);
    if (!rows.length)
        return `No communities match ${query}.`;
    return `Community search for ${query}:\n` + rows.map((row, i) => {
        const view = object(row), c = object(view.community), counts = object(view.counts);
        return `${i + 1}. !${lemmyField(c.name)} — ${lemmyField(c.title)} | subscribers ${lemmyField(counts.subscribers)}\n   ${lemmyField(c.actor_id, 500)}`;
    }).join('\n');
}
