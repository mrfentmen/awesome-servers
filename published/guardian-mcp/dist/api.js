const BASE = 'https://content.guardianapis.com/search';
async function fetchArticles(params) {
    const res = await fetch(`${BASE}?api-key=test&page-size=30&${params}`, {
        headers: { 'User-Agent': 'mrfentmen-guardian-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Guardian returned ${res.status}`);
    const data = (await res.json());
    return data.response?.results ?? [];
}
function formatRows(rows, total) {
    if (!rows.length)
        return 'No Guardian articles found.';
    return `Guardian articles (${total} total, ${rows.length} shown):\n` +
        rows
            .map((r, i) => `${i + 1}. ${r.webTitle ?? 'untitled'}\n   ${String(r.webPublicationDate ?? '').slice(0, 10)} | ${r.webUrl ?? ''}`)
            .join('\n');
}
export async function search(args) {
    const q = (args.query ?? '').trim();
    if (!q)
        return 'Provide a search query.';
    const limit = Math.max(1, Math.min(args.limit ?? 10, 30));
    const rows = await fetchArticles(`q=${encodeURIComponent(q)}`);
    return formatRows(rows.slice(0, limit), rows.length);
}
export async function latest(args = {}) {
    const limit = Math.max(1, Math.min(args.limit ?? 10, 30));
    const rows = await fetchArticles('order-by=newest');
    return formatRows(rows.slice(0, limit), rows.length);
}
// ---- muxC tools:
// The Guardian's open API no longer honours its own documented `api-key=test`,
// so these tools use the keyless RSS feeds on www.theguardian.com instead.
