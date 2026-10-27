const BASE = 'https://vocadb.net/api/songs';
export async function search(args) {
    const q = (args.query ?? '').trim();
    if (!q)
        return 'Provide search terms.';
    const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
    const params = new URLSearchParams({ query: q, maxResults: String(limit), fields: 'Names,MainPicture' });
    const res = await fetch(`${BASE}?${params.toString()}`, {
        headers: { 'User-Agent': 'mrfentmen-vocadb-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`VocaDB returned ${res.status}`);
    const d = (await res.json());
    const rows = d.items ?? [];
    if (!rows.length)
        return `No VocaDB songs found for "${q}".`;
    return `VocaDB songs for "${q}" (${rows.length} shown):\n` +
        rows
            .map((r, i) => {
            const s = (k) => (r[k] != null ? String(r[k]) : '');
            const name = s('name');
            return `${i + 1}. ${name}${s('artistString') ? ` | ${s('artistString')}` : ''}${s('songType') ? ` [${s('songType')}]` : ''}`;
        })
            .join('\n');
}
async function vocadbGet(url) {
    const res = await fetch(url, {
        headers: { 'User-Agent': 'mrfentmen-vocadb-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`VocaDB returned ${res.status}`);
    return (await res.json());
}
// ---- gap4c3 tools:
const vdValue = (value) => value == null || value === '' ? 'not reported' : String(value).slice(0, 500);
export async function tagSearch(args) {
    const limit = Math.max(1, Math.min(Math.trunc(args.limit ?? 10), 25));
    const params = new URLSearchParams({ query: args.query.trim(), maxResults: String(limit), fields: 'Description' });
    const d = await vocadbGet(`https://vocadb.net/api/tags?${params}`);
    const rows = (d.items ?? []).slice(0, limit);
    if (!rows.length)
        return 'No matching tags.';
    return 'VocaDB tags:\n' + rows.map(t => `${vdValue(t.name)} | tag ${vdValue(t.id)} | ${vdValue(t.categoryName)} | uses ${vdValue(t.usageCount)}\n${vdValue(t.description)}`).join('\n\n');
}
