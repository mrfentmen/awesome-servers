const BASE = 'https://binaryjazz.us/wp-json/genrenator/v1';
export async function genre(_args) {
    const res = await fetch(`${BASE}/genre`, {
        headers: { 'User-Agent': 'mrfentmen-genrenator-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Genrenator returned ${res.status}`);
    const text = (await res.text()).replace(/^"|"$/g, '');
    return `Random genre: ${text}`;
}
export async function genres(args) {
    const count = Math.min(Math.max(Number(args?.count ?? 5) || 5, 1), 20);
    const res = await fetch(`${BASE}/genre`, {
        headers: { 'User-Agent': 'mrfentmen-genrenator-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Genrenator returned ${res.status}`);
    const raw = (await res.text()).replace(/^"|"$/g, '');
    const items = raw.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    const out = [];
    for (let i = 0; i < count && i < items.length; i++)
        out.push(`${i + 1}. ${items[i]}`);
    if (!out.length)
        out.push('(empty response)');
    return `Genres:\n${out.join('\n')}`;
}
