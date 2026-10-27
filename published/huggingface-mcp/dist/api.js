const BASE = 'https://huggingface.co/api/models';
export async function models(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 10, 30));
    const params = new URLSearchParams({ limit: String(limit), sort: 'downloads', direction: '-1' });
    if (args.query)
        params.set('search', args.query.trim());
    const res = await fetch(`${BASE}?${params.toString()}`, {
        headers: { 'User-Agent': 'mrfentmen-huggingface-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Hugging Face returned ${res.status}`);
    const rows = (await res.json());
    if (!rows.length)
        return 'No models returned.';
    const label = args.query ? ` for "${args.query.trim()}"` : '';
    return `Hugging Face models${label} (${rows.length} shown):\n` +
        rows
            .map((r, i) => {
            const s = (k) => (r[k] != null ? String(r[k]) : '');
            return `${i + 1}. ${s('modelId')}${s('pipeline_tag') ? ` [${s('pipeline_tag')}]` : ''}${s('downloads') ? ` | downloads ${s('downloads')}` : ''}${s('likes') ? ` | likes ${s('likes')}` : ''}`;
        })
            .join('\n');
}
export async function model(args) {
    const name = (args.name ?? '').trim();
    if (!name)
        return 'Provide a model id like gpt2.';
    const res = await fetch(`${BASE}/${encodeURIComponent(name)}`, {
        headers: { 'User-Agent': 'mrfentmen-huggingface-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Hugging Face returned ${res.status}`);
    const d = (await res.json());
    const s = (k) => (d[k] != null ? String(d[k]) : '');
    const card = (d.cardData && typeof d.cardData === 'object' ? d.cardData : {});
    const cs = (k) => (card[k] != null ? String(card[k]) : '');
    return [
        `${s('modelId')}${s('pipeline_tag') ? ` [${s('pipeline_tag')}]` : ''}`,
        s('author') ? `Author: ${s('author')}` : '',
        s('downloads') ? `Downloads: ${s('downloads')}` : '',
        s('likes') ? `Likes: ${s('likes')}` : '',
        cs('language') ? `Languages: ${cs('language')}` : '',
        s('lastModified') ? `Updated: ${String(s('lastModified')).slice(0, 10)}` : '',
    ].filter(Boolean).join('\n') || `No data for ${name}.`;
}
// ---- muxC tools:
