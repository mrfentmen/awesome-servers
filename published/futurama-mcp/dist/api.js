const BASE = 'https://api.sampleapis.com/futurama/characters';
export async function characters(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
    const res = await fetch(BASE, {
        headers: { 'User-Agent': 'mrfentmen-futurama-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`SampleAPIs returned ${res.status}`);
    const d = (await res.json());
    if (!d.length)
        return 'No characters returned.';
    return `Futurama characters (${Math.min(d.length, limit)} of ${d.length} shown):\n` +
        d.slice(0, limit).map((c, i) => {
            const name = (c.name ?? {});
            const first = String(name.first ?? '');
            const last = String(name.last ?? '');
            const species = String(c.species ?? '');
            return `${i + 1}. ${first} ${last} (${species})`;
        }).join('\n');
}
export async function character(args) {
    const id = Math.floor(args.id ?? 0);
    if (!id)
        return 'Provide a character id.';
    const res = await fetch(`${BASE}/${id}`, {
        headers: { 'User-Agent': 'mrfentmen-futurama-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`SampleAPIs returned ${res.status}`);
    const d = (await res.json());
    const name = (d.name ?? {});
    const first = String(name.first ?? '');
    const last = String(name.last ?? '');
    const s = (k) => (d[k] != null ? String(d[k]) : '');
    const occupation = (d.occupation ?? {});
    const age = (d.age ?? '');
    const quotes = (d.quotes ?? []);
    return [
        `${first} ${last}`,
        `Species: ${s('species')} | Age: ${age}`,
        occupation ? `Occupation: ${String((occupation.primary ?? occupation) ?? '')}` : '',
        quotes.length ? `Quote: "${String(quotes[0])}"` : '',
    ].filter(Boolean).join('\n');
}
// ---- muxC tools:
