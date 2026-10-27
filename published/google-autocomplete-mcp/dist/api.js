const BASE = 'https://suggestqueries.google.com/complete/search';
export async function suggest(args) {
    const q = (args.query ?? '').trim();
    if (!q)
        return 'Provide search terms.';
    const limit = Math.max(1, Math.min(args.limit ?? 10, 20));
    const params = new URLSearchParams({ client: 'firefox', q });
    const res = await fetch(`${BASE}?${params.toString()}`, {
        headers: { 'User-Agent': 'mrfentmen-google-autocomplete-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Google suggest returned ${res.status}`);
    const d = (await res.json());
    const rows = (Array.isArray(d[1]) ? d[1] : []).slice(0, limit);
    if (!rows.length)
        return `No suggestions for "${q}".`;
    return `Google suggestions for "${q}" (${rows.length} shown):\n` +
        rows.map((r, i) => `${i + 1}. ${r}`).join('\n');
}
// ---- muxB tools:
async function suggestArray(client, query, extra) {
    const params = new URLSearchParams({ client, q: query, ...extra });
    const res = await fetch(`${BASE}?${params.toString()}`, {
        headers: { 'User-Agent': 'mrfentmen-google-autocomplete-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Google suggest returned ${res.status}`);
    const raw = (await res.text()).trim();
    // the youtube client answers JSONP, so unwrap window.google.ac.h(...) first
    const body = raw.startsWith('window.google.ac.h(') ? raw.slice('window.google.ac.h('.length, raw.lastIndexOf(')')) : raw;
    let d;
    try {
        d = JSON.parse(body);
    }
    catch {
        return [];
    }
    if (!Array.isArray(d) || !Array.isArray(d[1]))
        return [];
    return d[1]
        .map((row) => (typeof row === 'string' ? row : Array.isArray(row) && typeof row[0] === 'string' ? row[0] : ''))
        .filter((x) => x !== '');
}
