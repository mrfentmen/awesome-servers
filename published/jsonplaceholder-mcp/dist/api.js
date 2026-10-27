const BASE = 'https://jsonplaceholder.typicode.com';
export async function todos(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
    const res = await fetch(`${BASE}/todos?_limit=${limit}`, {
        headers: { 'User-Agent': 'mrfentmen-jsonplaceholder-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`JSONPlaceholder returned ${res.status}`);
    const d = (await res.json());
    return `Todos (${d.length} shown):\n` +
        d.map((t, i) => {
            const s = (k) => (t[k] != null ? String(t[k]) : '');
            return `${i + 1}. [${s('completed') === 'true' || t.completed ? 'x' : ' '}] ${s('title')}`;
        }).join('\n');
}
export async function posts(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
    const res = await fetch(`${BASE}/posts?_limit=${limit}`, {
        headers: { 'User-Agent': 'mrfentmen-jsonplaceholder-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`JSONPlaceholder returned ${res.status}`);
    const d = (await res.json());
    return `Posts (${d.length} shown):\n` +
        d.map((p, i) => {
            const s = (k) => (p[k] != null ? String(p[k]) : '');
            return `${i + 1}. ${s('title')}`;
        }).join('\n');
}
export async function users(_args) {
    const res = await fetch(`${BASE}/users`, {
        headers: { 'User-Agent': 'mrfentmen-jsonplaceholder-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`JSONPlaceholder returned ${res.status}`);
    const d = (await res.json());
    return `Users (${d.length}):\n` +
        d.map((u, i) => {
            const s = (k) => (u[k] != null ? String(u[k]) : '');
            return `${i + 1}. ${s('name')} | @${s('username')} | ${s('email')}`;
        }).join('\n');
}
