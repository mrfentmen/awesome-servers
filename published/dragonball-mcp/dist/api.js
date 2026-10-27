const BASE = 'https://dragonball-api.com/api';
export async function characters(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 20, 50));
    const res = await fetch(`${BASE}/characters?limit=${limit}`, {
        headers: { 'User-Agent': 'mrfentmen-dragonball-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Dragon Ball API returned ${res.status}`);
    const d = (await res.json());
    const rows = d.items ?? [];
    if (!rows.length)
        return 'No characters returned.';
    return `Dragon Ball characters (${rows.length} shown):\n` +
        rows.map((r, i) => {
            const s = (k) => (r[k] != null ? String(r[k]) : '');
            return `${i + 1}. ${s('name')} | race ${s('race')} | ki ${s('ki')}`;
        }).join('\n');
}
export async function character(args) {
    const name = (args.name ?? '').trim();
    if (!name)
        return 'Provide a character name.';
    const res = await fetch(`${BASE}/characters?name=${encodeURIComponent(name)}`, {
        headers: { 'User-Agent': 'mrfentmen-dragonball-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Dragon Ball API returned ${res.status}`);
    const raw = (await res.json());
    const rows = Array.isArray(raw) ? raw : (raw.items ?? []);
    if (!rows.length)
        return `No character named "${name}".`;
    const r = rows[0];
    const s = (k) => (r[k] != null ? String(r[k]) : '');
    return [
        `${s('name')} (${s('race')})`,
        `Ki: ${s('ki')} (max ${s('maxKi')})`,
        s('affiliation') ? `Affiliation: ${s('affiliation')}` : '',
        s('description') ? `\n${s('description')}` : '',
    ].filter(Boolean).join('\n');
}
export async function planets(args = {}) {
    const page = Math.max(1, Math.min(Math.trunc(Number(args.page ?? 1)) || 1, 100));
    const limit = Math.max(1, Math.min(Math.trunc(Number(args.limit ?? 10)) || 10, 50));
    const res = await fetch(`${BASE}/planets?page=${page}&limit=${limit}`, {
        headers: { 'User-Agent': 'mrfentmen-dragonball-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Dragon Ball API returned ${res.status}`);
    const d = (await res.json());
    const rows = d.items ?? [];
    if (!rows.length)
        return `No planets on page ${page}.`;
    const meta = d.meta ?? {};
    const lines = [
        `Dragon Ball planets — page ${meta.currentPage ?? page} of ${meta.totalPages ?? '?'}, ${meta.totalItems ?? '?'} in total, ${rows.length} shown`,
    ];
    for (const [i, r] of rows.entries()) {
        lines.push(`${i + 1}. ${r.name ?? 'unnamed'}${r.isDestroyed ? ' (destroyed)' : ' (intact)'}`);
        if (r.description)
            lines.push(`   ${String(r.description).slice(0, 160)}`);
    }
    return lines.join('\n');
}

const DRAGONBALL = 'https://dragonball-api.com/api/characters';
export async function characterDetail(args = {}) {
    const id = Number(args?.id);
    if (!Number.isInteger(id) || id < 1)
        throw new Error('Provide a character id, like 1 for Goku.');
    const res = await fetch(`${DRAGONBALL}/${id}`, {
        headers: { 'User-Agent': 'mrfentmen-dragonball-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 404)
        throw new Error(`No Dragon Ball character has id ${id}`);
    if (!res.ok)
        throw new Error(`Dragon Ball API returned ${res.status}`);
    const c = (await res.json());
    if (!c?.name)
        throw new Error('Dragon Ball API returned no character');
    const planet = c.originPlanet;
    const transforms = Array.isArray(c.transformations) ? c.transformations : [];
    return [
        `${c.name} (id ${c.id})`,
        `Ki: ${c.ki ?? '?'}${c.maxKi ? ` · max ${c.maxKi}` : ''}`,
        `Race: ${c.race ?? '?'} · gender ${c.gender ?? '?'} · ${c.affiliation ?? 'no affiliation'}`,
        planet ? `Origin: ${planet.name ?? '?'}${planet.isDestroyed ? ' (destroyed)' : ''}` : 'Origin: unknown',
        transforms.length
            ? `Transformations (${transforms.length}): ${transforms.map((t) => `${t.name}${t.ki ? ` [${t.ki}]` : ''}`).join(', ')}`
            : 'Transformations: none on record',
        (c.description ?? '').trim().slice(0, 600),
        'https://dragonball-api.com/api/characters/' + c.id,
    ].filter(Boolean).join('\n');
}
