const BASE = 'https://rhymebrain.com/talk';
const UA = 'mrfentmen-rhymebrain-mcp/1.0';
export async function rhymes(args) {
    const word = (args.word ?? '').trim().toLowerCase();
    if (!word)
        return 'Provide a word.';
    const limit = Math.min(Math.max(Number(args.limit ?? 15) || 15, 1), 50);
    const res = await fetch(`${BASE}?function=getRhymes&word=${encodeURIComponent(word)}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`RhymeBrain returned ${res.status}`);
    const d = (await res.json());
    if (!Array.isArray(d) || !d.length)
        return `No rhymes for "${word}".`;
    const rows = d.slice(0, limit).map((r, i) => `${i + 1}. ${r.word ?? '?'} (${r.syllables ?? '?'} syll)`);
    return `Rhymes for "${word}" (${d.length} found, showing ${rows.length}):\n${rows.join('\n')}`;
}
