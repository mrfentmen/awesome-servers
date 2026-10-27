const BASE = 'https://random-d.uk/api/v2';
export async function random(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 1, 10));
    const res = await fetch(`${BASE}/random?count=${limit}`, {
        headers: { 'User-Agent': 'mrfentmen-duck-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Random-d.uk returned ${res.status}`);
    const d = (await res.json());
    const urls = Array.isArray(d) ? d.map((r) => r.url ?? '').filter(Boolean) : (d.url ? [d.url ?? ''] : []);
    const rows = urls.slice(0, limit);
    if (!rows.length)
        return 'No duck photos returned.';
    return `Random ducks (${rows.length}):\n` + rows.map((u, i) => `${i + 1}. ${u}`).join('\n');
}
