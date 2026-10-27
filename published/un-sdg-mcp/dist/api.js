const UA = 'mrfentmen-un-sdg-mcp/1.0';
export async function indicators(args) {
    const goal = (args?.goal ?? '').trim();
    const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 30);
    const base = 'https://unstats.un.org/SDGAPI/v1/sdg/Indicator/List';
    const url = goal ? `${base}?goal=${encodeURIComponent(goal)}` : base;
    const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new Error(`UN SDG API returned ${res.status}`);
    const d = (await res.json());
    if (!Array.isArray(d) || !d.length)
        return goal ? `No SDG indicators for goal ${goal}.` : 'No SDG indicators returned.';
    const header = goal ? `SDG indicators for goal ${goal} (${d.length}):` : `SDG indicators (${d.length} total, showing ${Math.min(limit, d.length)}):`;
    return header + '\n' + d.slice(0, limit).map((x, i) => `${i + 1}. [${x.code ?? '?'}] ${x.description ?? '?'}`).join('\n');
}
