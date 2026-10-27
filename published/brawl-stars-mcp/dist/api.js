const BASE = 'https://api.brawlapi.com/v1';
export async function brawlers() {
    const res = await fetch(`${BASE}/brawlers`, {
        headers: { 'User-Agent': 'mrfentmen-brawl-stars-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`BrawlAPI returned ${res.status}`);
    const d = (await res.json());
    const rows = d.list ?? [];
    if (!rows.length)
        return 'No brawlers returned.';
    return `Brawl Stars brawlers (${rows.length}):\n` +
        rows.slice(0, 30).map((b, i) => {
            const s = (k) => (b[k] != null ? String(b[k]) : '');
            const rar = b.rarity?.name;
            return `${i + 1}. ${s('name')} | rarity ${String(rar ?? b.rarity ?? '')}`;
        }).join('\n');
}
export async function brawler(args) {
    const name = (args.name ?? '').trim();
    if (!name)
        return 'Provide a brawler name.';
    const listRes = await fetch(`${BASE}/brawlers`, {
        headers: { 'User-Agent': 'mrfentmen-brawl-stars-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!listRes.ok)
        throw new Error(`BrawlAPI returned ${listRes.status}`);
    const d = (await listRes.json());
    const found = (d.list ?? []).find((b) => String(b.name ?? '').toLowerCase() === name.toLowerCase());
    if (!found)
        return `No brawler named "${name}".`;
    const s = (k) => (found[k] != null ? String(found[k]) : '');
    const sp = (found.starPowers ?? []);
    const ga = (found.gadgets ?? []);
    return [
        `${s('name')} (id ${s('id')})`,
        s('rarity') ? `Rarity: ${s('rarity')}` : '',
        s('class') ? `Class: ${s('class')}` : '',
        s('description') ? `\n${s('description')}` : '',
        sp.length ? `Star powers (${sp.length}): ${sp.slice(0, 3).map((x) => String(x.name ?? '')).join(', ')}` : '',
        ga.length ? `Gadgets (${ga.length}): ${ga.slice(0, 3).map((x) => String(x.name ?? '')).join(', ')}` : '',
    ].filter(Boolean).join('\n');
}
