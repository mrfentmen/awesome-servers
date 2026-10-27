const BASE = 'https://api.plos.org/search';
const UA = 'mrfentmen-plos-mcp/1.0';
export async function search(args) {
    const query = (args.query ?? '').trim();
    if (!query)
        return 'Provide search terms.';
    const limit = Math.min(Math.max(Number(args.limit ?? 10) || 10, 1), 25);
    const res = await fetch(`${BASE}?q=${encodeURIComponent(`title:${query}`)}&rows=${limit}&fl=id,title,publication_date,journal`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`PLOS returned ${res.status}`);
    const d = (await res.json());
    const docs = d.response?.docs ?? [];
    if (!docs.length)
        return `No PLOS papers for "${query}".`;
    return `PLOS papers for "${query}" (total ${d.response?.numFound ?? docs.length}):\n` +
        docs.slice(0, limit).map((p, i) => `${i + 1}. ${p.title ?? '?'} (${String(p.publication_date ?? '').slice(0, 10)}) [${p.journal ?? '?'}]`).join('\n');
}
// ---- muxC tools:
const PLOS_UA = "mrfentmen-plos-mcp/1.0";
async function plosSearch(query, fl, rows) {
    const url = `${BASE}?q=${encodeURIComponent(query)}&rows=${rows}&fl=${encodeURIComponent(fl)}`;
    const res = await fetch(url, {
        headers: { "User-Agent": PLOS_UA, Accept: "application/json" },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`PLOS returned ${res.status}`);
    const d = (await res.json());
    return d.response ?? {};
}
function docString(value, max = 300) {
    if (value === undefined || value === null)
        return "not reported";
    if (Array.isArray(value))
        return value.map((v) => String(v)).join("; ").slice(0, max);
    const s = String(value);
    return s.length > max ? `${s.slice(0, max)}...` : s;
}
