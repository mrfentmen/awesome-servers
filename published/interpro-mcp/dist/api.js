const BASE = 'https://www.ebi.ac.uk/interpro/api/entry/interpro';
export async function entry(args) {
    const id = (args.id ?? '').trim().toUpperCase();
    if (!id)
        return 'Provide an entry accession like IPR000001.';
    const res = await fetch(`${BASE}/${encodeURIComponent(id)}/`, {
        headers: { 'User-Agent': 'mrfentmen-interpro-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`InterPro returned ${res.status}`);
    const d = (await res.json());
    const md = (d.metadata ?? {});
    const s = (k) => (md[k] != null ? String(md[k]) : '');
    const nameObj = (md.name ?? {});
    const name = String(nameObj.name ?? s('name'));
    const descArr = (md.description ?? []);
    const desc = String(descArr[0]?.text ?? '').replace(/<[^>]+>/g, '').trim();
    const go = (md.go_terms ?? []);
    const db = (md.source_database ?? '');
    return [
        `${name} (${s('accession')})`,
        desc ? `\n${desc}` : '',
        `Type: ${s('type')} | Source: ${db}`,
        go.length ? `GO terms: ${go.slice(0, 5).map((g) => String(g.identifier ?? '')).join(', ')}` : '',
    ].filter(Boolean).join('\n');
}
export async function search(args) {
    const query = (args.query ?? '').trim();
    if (!query)
        return 'Provide search terms.';
    const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
    const res = await fetch(`${BASE}/search/${encodeURIComponent(query)}/?page_size=${limit}`, {
        headers: { 'User-Agent': 'mrfentmen-interpro-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`InterPro returned ${res.status}`);
    const d = (await res.json());
    const rows = d.results ?? [];
    if (!rows.length)
        return `No entries found for "${query}".`;
    return `InterPro entries for "${query}" (${rows.length} shown):\n` +
        rows.map((r, i) => {
            const md = (r.metadata ?? {});
            const s = (k) => (md[k] != null ? String(md[k]) : '');
            return `${i + 1}. ${s('accession')} ${s('name')} (${s('type')})`;
        }).join('\n');
}
