const BASE = 'https://postman-echo.com';
export async function get(args) {
    const params = (args.params ?? '').trim();
    const url = params ? `${BASE}/get?${params}` : `${BASE}/get`;
    const res = await fetch(url, {
        headers: { 'User-Agent': 'mrfentmen-postman-echo-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Postman Echo returned ${res.status}`);
    const d = (await res.json());
    const s = (k) => (d[k] != null ? String(d[k]) : '');
    const echoArgs = (d.args ?? {});
    return [
        `GET ${s('url')}`,
        `Args: ${Object.entries(echoArgs).map(([k, v]) => `${k}=${String(v)}`).join(', ') || '(none)'}`,
    ].filter(Boolean).join('\n');
}
export async function ip(_args) {
    const res = await fetch(`${BASE}/ip`, {
        headers: { 'User-Agent': 'mrfentmen-postman-echo-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Postman Echo returned ${res.status}`);
    const d = (await res.json());
    return `Outbound IP: ${String(d.ip ?? 'unknown')}`;
}
// ---- muxB tools:
async function echoFetch(path, init = {}) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { 'User-Agent': 'mrfentmen-postman-echo-mcp/1.0', Accept: 'application/json, */*' },
        signal: AbortSignal.timeout(25000),
        ...init,
    });
    if (res.status >= 500)
        throw new Error(`Postman Echo returned ${res.status}`);
    return res;
}
const pickHeaders = (res, names) => names
    .filter((n) => res.headers.get(n))
    .map((n) => `  ${n}: ${String(res.headers.get(n)).slice(0, 160)}`);
// ---- gap4b2 tools:
