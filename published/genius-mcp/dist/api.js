const BASE = 'https://genius.com/api/search/multi';
export async function search(args) {
    const q = (args.query ?? '').trim();
    if (!q)
        return 'Provide a search query.';
    const limit = Math.max(1, Math.min(args.limit ?? 10, 20));
    const res = await fetch(`${BASE}?q=${encodeURIComponent(q)}`, {
        headers: { 'User-Agent': 'mrfentmen-genius-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Genius returned ${res.status}`);
    const data = (await res.json());
    const sections = data.response?.sections ?? [];
    const rows = [];
    for (const section of sections) {
        const type = section.type ?? '';
        for (const hit of section.hits ?? []) {
            const r = hit.result ?? {};
            const name = r.name ?? r.title ?? '';
            const artist = r.primary_artist ? String(r.primary_artist.name ?? '') : '';
            const url = r.url ? String(r.url) : '';
            rows.push(`${name}${artist ? ` by ${artist}` : ''}${type ? ` [${type}]` : ''}${url ? `\n   ${url}` : ''}`);
            if (rows.length >= limit)
                break;
        }
        if (rows.length >= limit)
            break;
    }
    if (!rows.length)
        return `No Genius results for "${q}".`;
    return `Genius results for "${q}" (${rows.length} shown):\n` + rows.map((r, i) => `${i + 1}. ${r}`).join('\n');
}
async function webGet(path) {
    const res = await fetch(`https://genius.com/api${path}`, {
        headers: { 'User-Agent': 'mrfentmen-genius-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Genius returned ${res.status}`);
    return res.json();
}
export async function songDetails(args) {
    const id = (args.id ?? '').trim();
    if (!id)
        return 'Provide a Genius song id.';
    const d = await webGet(`/songs/${encodeURIComponent(id)}`);
    const s = d?.response?.song ?? {};
    return `${s.title ?? '?'} by ${s.primary_artist?.name ?? '?'} | ${s.release_date_for_display ?? '?'}\nPageviews: ${s.stats?.pageviews ?? '?'}${s.album?.name ? ` | Album: ${s.album.name}` : ''}\n${s.url ?? ''}`;
}
export async function artistSongs(args) {
    const id = (args.id ?? '').trim();
    if (!id)
        return 'Provide a Genius artist id.';
    const limit = Math.max(1, Math.min(args.limit ?? 10, 20));
    const d = await webGet(`/artists/${encodeURIComponent(id)}/songs?per_page=${limit}&sort=popularity`);
    const rows = d?.response?.songs ?? [];
    if (!rows.length)
        return `No songs for artist ${id}.`;
    return rows.map((s, i) => `${i + 1}. ${s.title ?? '?'}${s.release_date_for_display ? ` (${s.release_date_for_display})` : ''}`).join('\n');
}
export async function artistDetails(args) {
    const id = (args.id ?? '').trim();
    if (!id)
        return 'Provide a Genius artist id.';
    const d = await webGet(`/artists/${encodeURIComponent(id)}`);
    const a = d?.response?.artist ?? {};
    return `${a.name ?? '?'}${a.alternate_names?.length ? ` aka ${a.alternate_names.slice(0, 3).join(', ')}` : ''}\n${(a.description?.plain ?? '').slice(0, 300)}${a.url ? `\n${a.url}` : ''}`;
}
