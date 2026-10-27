const UA = 'mrfentmen-mygene-mcp/1.0';
const BASE = 'https://mygene.info/v3';
export async function query(args) {
    const size = Math.min(Math.max(Number(args?.size ?? 5) || 5, 1), 20);
    const res = await fetch(`${BASE}/query?q=${encodeURIComponent(args.q)}&size=${size}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`MyGene returned ${res.status}`);
    const d = (await res.json());
    const hits = d.hits ?? [];
    if (!hits.length)
        return `No genes found for "${args.q}".`;
    return `Genes matching "${args.q}" (${d.total ?? hits.length} hits):\n` + hits.slice(0, size).map((h, i) => `${i + 1}. ${h.symbol ?? '?'} (${h.name ?? '?'}) | taxid ${h.taxid ?? '?'} | ${h.type_of_gene ?? 'gene'}`).join('\n');
}
export async function get(args) {
    const res = await fetch(`${BASE}/gene/${encodeURIComponent(args.id)}?fields=symbol,name,taxid,entrezgene,summary,type_of_gene`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`MyGene returned ${res.status}`);
    const d = (await res.json());
    if (!d._id)
        throw new Error(`No gene for id ${args.id}.`);
    return `Gene ${d.symbol ?? args.id}\n${d.name ?? ''}\nEntrez id: ${d.entrezgene ?? d._id} | taxid ${d.taxid ?? '?'} | ${d.type_of_gene ?? 'gene'}\nSummary: ${(d.summary ?? 'No summary').slice(0, 500)}`;
}
async function geneQuery(q, fields, size) {
    const res = await fetch(`${BASE}/query?q=${encodeURIComponent(q)}&size=${size}&fields=${fields}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`MyGene returned ${res.status}`);
    const d = (await res.json());
    return d.hits ?? [];
}
