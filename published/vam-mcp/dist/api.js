const BASE = 'https://api.vam.ac.uk/v2/objects/search';
export async function search(args) {
    const query = (args.query ?? '').trim();
    if (!query)
        return 'Provide search terms.';
    const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
    const res = await fetch(`${BASE}?q=${encodeURIComponent(query)}&images_exist=true&page_size=${limit}`, {
        headers: { 'User-Agent': 'mrfentmen-vam-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`V&A returned ${res.status}`);
    const d = (await res.json());
    const rows = d.records ?? [];
    if (!rows.length)
        return `No objects found for "${query}".`;
    return `V&A objects for "${query}" (${rows.length} shown):\n` +
        rows.map((r, i) => {
            const s = (k) => (r[k] != null ? String(r[k]) : '');
            const date = (r._primaryDate ?? r.recordCreated ?? '');
            const maker = r._primaryMaker;
            const artist = String(maker?.name ?? '');
            return `${i + 1}. ${s('_primaryTitle') || s('object')}${artist ? ` | ${artist}` : ''}${date ? ` | ${date}` : ''}`;
        }).join('\n');
}
// ---- muxC tools:
// The V&A wraps most values twice: a list of {name:{text,id}} or
// {place:{text,id}} or {date:{text,...}}. Flatten either shape to plain text.
