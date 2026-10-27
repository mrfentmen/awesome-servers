const BASE = 'https://yesno.wtf/api';
export async function answer(_args = {}) {
    const res = await fetch(BASE, {
        headers: { 'User-Agent': 'mrfentmen-yesno-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
    });
    if (!res.ok)
        throw new Error(`yesno.wtf returned ${res.status}`);
    const data = (await res.json());
    if (!data.answer)
        throw new Error('yesno.wtf returned an empty answer');
    return `${data.answer} ${data.image ?? ''}`.trim();
}
// ---- gap4c4 tools:
export async function wikipediaPageExists(args) {
    const title = args.title.trim().slice(0, 200);
    if (!title)
        throw new Error('Provide a page title.');
    const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1&titles=${encodeURIComponent(title)}`, {
        headers: { Accept: 'application/json', 'User-Agent': 'mrfentmen-yesno-mcp/1.0' }, signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Wikipedia returned ${res.status}`);
    const d = await res.json();
    if (d.error)
        throw new Error(d.error.info ?? 'Wikipedia query failed');
    const pages = Object.values(d.query?.pages ?? {});
    if (!pages.length)
        throw new Error('Wikipedia did not report a page result.');
    return pages.slice(0, 5).map(p => p.pageid != null && p.missing === undefined && p.invalid === undefined
        ? `Yes - ${p.title ?? title} exists: https://en.wikipedia.org/?curid=${p.pageid}`
        : `No - Wikipedia reports no valid page for ${p.title ?? title}.`).join('\n');
}
