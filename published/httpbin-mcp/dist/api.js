const BASE = 'https://httpbin.org';
export async function get(args) {
    const path = (args.path ?? '').trim().replace(/^\//, '');
    if (!path)
        return 'Provide an endpoint path.';
    const res = await fetch(`${BASE}/${path}`, {
        headers: { 'User-Agent': 'mrfentmen-httpbin-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`HTTPBin returned ${res.status}`);
    const d = await res.text();
    return `HTTPBin GET /${path} -> ${res.status}\n${d.slice(0, 600)}`;
}
export async function ip(_args) {
    const res = await fetch(`${BASE}/ip`, {
        headers: { 'User-Agent': 'mrfentmen-httpbin-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`HTTPBin returned ${res.status}`);
    const d = (await res.json());
    return `Outbound IP: ${String(d.origin ?? 'unknown')}`;
}
export async function headers(_args) {
    const res = await fetch(`${BASE}/headers`, {
        headers: { 'User-Agent': 'mrfentmen-httpbin-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`HTTPBin returned ${res.status}`);
    const d = (await res.json());
    const h = d.headers ?? {};
    return 'Request headers:\n' + Object.entries(h).map(([k, v]) => `${k}: ${String(v)}`).join('\n');
}
// ---- muxC tools:
