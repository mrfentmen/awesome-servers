const BASE = 'https://www.loc.gov/search/';
export async function search(args) {
    const q = (args.query ?? '').trim();
    if (!q)
        return 'Provide a search query.';
    const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
    const res = await fetch(`${BASE}?q=${encodeURIComponent(q)}&fo=json&c=${limit}`, {
        headers: { 'User-Agent': 'mrfentmen-loc-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`Library of Congress returned ${res.status}`);
    const data = (await res.json());
    const results = data.results ?? [];
    if (!results.length)
        return `No Library of Congress results for "${q}".`;
    return `Library of Congress results for "${q}" (${data.pagination?.total ?? results.length} total, ${results.length} shown):\n` +
        results
            .map((r, i) => {
            const title = r.title ?? 'untitled';
            const date = r.date ?? '';
            const url = r.url ?? '';
            return `${i + 1}. ${title}${date ? ` | ${date}` : ''}${url ? `\n   ${url}` : ''}`;
        })
            .join('\n');
}
async function sectionSearch(section, args) {
    const q = (args.query ?? '').trim();
    if (!q)
        return 'Provide a search query.';
    const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
    const res = await fetch(`https://www.loc.gov/${section}/?q=${encodeURIComponent(q)}&fo=json&c=${limit}`, {
        headers: { 'User-Agent': 'mrfentmen-loc-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`Library of Congress returned ${res.status}`);
    const data = (await res.json());
    const results = data.results ?? [];
    if (!results.length)
        return `No Library of Congress ${section} results for "${q}".`;
    return `Library of Congress ${section} for "${q}" (${data.pagination?.total ?? results.length} total):\n` +
        results.map((r, i) => {
            const title = r.title ?? 'untitled';
            const date = r.date ?? '';
            const url = r.url ?? '';
            return `${i + 1}. ${title}${date ? ` | ${date}` : ''}${url ? `\n   ${url}` : ''}`;
        }).join('\n');
}
export async function photos(args) {
    return sectionSearch('photos', args);
}
export async function books(args) {
    return sectionSearch('books', args);
}
export async function maps(args) {
    return sectionSearch('maps', args);
}
export async function audio(args) {
    return sectionSearch('audio', args);
}
export async function newspapers(args) {
    return sectionSearch('newspapers', args);
}
export async function manuscripts(args) {
    return sectionSearch('manuscripts', args);
}
