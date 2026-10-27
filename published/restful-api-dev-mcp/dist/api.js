const UA = 'mrfentmen-restful-api-dev-mcp/1.0';
export async function objects(args) {
    const limit = Math.min(Math.max(Number(args?.limit ?? 5) || 5, 1), 20);
    const res = await fetch('https://api.restful-api.dev/objects', {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`restful-api.dev returned ${res.status}`);
    const d = (await res.json());
    if (!Array.isArray(d) || !d.length)
        return 'No objects returned.';
    return `restful-api.dev test objects (${d.length}, showing ${Math.min(limit, d.length)}):\n` +
        d.slice(0, limit).map((x, i) => `${i + 1}. ${x.name ?? '?'} (id=${x.id ?? '?'})`).join('\n');
}
export async function object(args) {
    const id = (args.id ?? '').trim();
    if (!id)
        return 'Provide an object id.';
    const res = await fetch(`https://api.restful-api.dev/objects/${encodeURIComponent(id)}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`restful-api.dev returned ${res.status}`);
    const d = (await res.json());
    const name = d.name ?? '?';
    const data = d.data ? JSON.stringify(d.data) : 'none';
    return `restful-api.dev object ${id}:\nName: ${String(name)}\nData: ${String(data)}`;
}
// ---- muxB tools:
const MOCK = 'https://jsonplaceholder.typicode.com';
async function mockGet(path) {
    const res = await fetch(`${MOCK}${path}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`jsonplaceholder returned ${res.status}`);
    return (await res.json());
}
const flat = (s) => s.replace(/\s+/g, ' ').trim();
export async function mockPosts(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 6, 20));
    const rows = await mockGet(`/posts?_limit=${limit}`);
    if (!Array.isArray(rows) || !rows.length)
        return 'jsonplaceholder returned no posts.';
    return `jsonplaceholder posts (${rows.length} shown):\n` +
        rows
            .map((p, i) => {
            const body = flat(p.body ?? '');
            return `${i + 1}. [id=${p.id ?? '?'}, userId=${p.userId ?? '?'}] ${p.title ?? 'untitled'}\n   ${body ? body.slice(0, 180) : 'no body'}`;
        })
            .join('\n');
}
