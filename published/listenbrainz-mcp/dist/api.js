const BASE = 'https://api.listenbrainz.org/1';
export async function user(args) {
    const username = (args.username ?? '').trim();
    if (!username)
        return 'Provide a username.';
    const count = Math.max(1, Math.min(args.count ?? 10, 50));
    const res = await fetch(`${BASE}/user/${encodeURIComponent(username)}/listens?count=${count}`, {
        headers: { 'User-Agent': 'mrfentmen-listenbrainz-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`ListenBrainz returned ${res.status}`);
    const d = (await res.json());
    const listens = d.payload?.listens ?? [];
    if (!listens.length)
        return `No recent listens for ${username}.`;
    return `Recent listens for ${username} (${listens.length} shown):\n` +
        listens.map((l, i) => {
            const t = (l.track_metadata ?? {});
            const s = (k) => (t[k] != null ? String(t[k]) : '');
            return `${i + 1}. ${s('track_name')} - ${s('artist_name')}`;
        }).join('\n');
}
export async function popular(args) {
    const username = (args.username ?? '').trim();
    if (!username)
        return 'Provide a username.';
    const res = await fetch(`${BASE}/stats/user/${encodeURIComponent(username)}/artists?range=all_time&count=10`, {
        headers: { 'User-Agent': 'mrfentmen-listenbrainz-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`ListenBrainz returned ${res.status}`);
    const d = (await res.json());
    const artists = d.payload?.artists ?? [];
    if (!artists.length)
        return `No artist stats for ${username}.`;
    return `Top artists for ${username}:\n` +
        artists.map((a, i) => {
            const s = (k) => (a[k] != null ? String(a[k]) : '');
            return `${i + 1}. ${s('artist_name')} (${s('listen_count')} listens)`;
        }).join('\n');
}
