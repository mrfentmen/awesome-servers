const BASE = 'https://f-droid.org/api/v1';
export async function search(args) {
    const q = (args.query ?? '').trim();
    if (!q)
        return 'Provide search terms.';
    const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
    const res = await fetch(`${BASE}/search?q=${encodeURIComponent(q)}&lang=en`, {
        headers: { 'User-Agent': 'mrfentmen-f-droid-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`F-Droid returned ${res.status}`);
    const rows = (await res.json());
    if (!rows.length)
        return `No F-Droid apps found for "${q}".`;
    return `F-Droid apps for "${q}" (${rows.slice(0, limit).length} shown):\n` +
        rows
            .slice(0, limit)
            .map((r, i) => {
            const s = (k) => (r[k] != null ? String(r[k]) : '');
            return `${i + 1}. ${s('packageName')} ${s('title')}${s('summary') ? ` | ${s('summary').slice(0, 80)}` : ''}`;
        })
            .join('\n');
}
// ---- muxE tools:
// The one existing tool calls /api/v1/search, a route the F-Droid API does not
// serve at all: it answers HTTP 404 {"error":"NOT_FOUND"} for every query, so
// nothing here can be built on it. Two routes are genuinely live, verified
// before coding. /api/v1/packages/<packageName> returns the version list, and
// repo/index-v1.json answers an HTTP Range request, so the repository header can
// be read from the first 64 KB of a 63 MB file instead of downloading all of it.
const FD_INDEX = 'https://f-droid.org/repo/index-v1.json';
const FD_UA = 'mrfentmen-f-droid-mcp/1.0';
const FD_HEADER_BYTES = 65535;
/** reads only the repository header, which lives in the first object of the index */
export async function repoHeader(_args = {}) {
    const res = await fetch(FD_INDEX, {
        headers: { 'User-Agent': FD_UA, Accept: 'application/json', Range: `bytes=0-${FD_HEADER_BYTES}` },
        signal: AbortSignal.timeout(45000),
    });
    if (res.status !== 206 && res.status !== 200) {
        if (res.status === 404)
            throw new Error('F-Droid has no repository index at that address.');
        throw new Error(`F-Droid returned ${res.status} for the index range request`);
    }
    const total = Number(/bytes 0-(\d+)\/(\d+)/.exec(res.headers.get('content-range') ?? '')?.[2] ?? 0);
    const chunk = await res.text();
    if (!chunk.trim())
        throw new Error('F-Droid returned an empty index range.');
    const at = chunk.indexOf('"repo"');
    if (at < 0)
        throw new Error('The index range did not contain the repository header.');
    const colon = chunk.indexOf(':', at);
    const start = chunk.slice(colon + 1).replace(/^\s+/, '');
    let depth = 0;
    let end = -1;
    for (let i = 0; i < start.length; i += 1) {
        const ch = start[i];
        if (ch === '{')
            depth += 1;
        else if (ch === '}') {
            depth -= 1;
            if (depth === 0) {
                end = i;
                break;
            }
        }
    }
    if (end < 0)
        throw new Error('The repository header did not close inside the range that was read; the index layout has changed.');
    let repo;
    try {
        repo = JSON.parse(start.slice(0, end + 1));
    }
    catch {
        throw new Error('The repository header could not be parsed out of the index range.');
    }
    const stamp = typeof repo.timestamp === 'number' ? new Date(repo.timestamp).toISOString().slice(0, 19).replace('T', ' ') + ' UTC' : 'not reported';
    const mirrors = Array.isArray(repo.mirrors) ? repo.mirrors : [];
    const onions = mirrors.filter((m) => typeof m === 'string' && m.includes('.onion'));
    const lines = [
        `F-Droid repository header, read from the first ${FD_HEADER_BYTES + 1} bytes of the index:`,
        `  whole index size: ${total > 0 ? `${total.toLocaleString('en-US')} bytes` : 'not reported by the server'}`,
        `  index built: ${stamp}`,
        `  index format version: ${typeof repo.version === 'number' ? repo.version : 'not reported'}`,
        `  clients may cache for: ${typeof repo.maxage === 'number' ? `${repo.maxage} hour(s)` : 'not reported'}`,
        `  repository name: ${repo.name ?? 'not reported'}`,
        `  repository address: ${repo.address ?? 'not reported'}`,
        `  web base url: ${repo.webBaseUrl ?? 'not reported'}`,
        `  icon: ${repo.icon ?? 'not reported'}`,
        `  mirrors listed: ${mirrors.length}, of which onion addresses: ${onions.length}`,
    ];
    if (repo.description)
        lines.push(`  description: ${repo.description.replace(/\s+/g, ' ').slice(0, 400)}`);
    if (mirrors.length) {
        lines.push('  the first eight mirrors:');
        for (const m of mirrors.slice(0, 8))
            lines.push(`    ${String(m).slice(0, 120)}`);
        if (mirrors.length > 8)
            lines.push(`    and ${mirrors.length - 8} more`);
    }
    lines.push('  only the repository header is read here, not the per app entries, so this stays a small request against a very large file.');
    return lines.join('\n');
}
