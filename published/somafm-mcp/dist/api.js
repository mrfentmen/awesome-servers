const BASE = 'https://somafm.com';
async function fetchChannels() {
    const res = await fetch(`${BASE}/channels.json`, {
        headers: { 'User-Agent': 'mrfentmen-somafm-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`SomaFM returned ${res.status}`);
    const d = (await res.json());
    return d.channels ?? [];
}
export async function channels(args) {
    const all = await fetchChannels();
    const q = (args?.genre ?? '').trim().toLowerCase();
    const list = q ? all.filter((c) => String(c.genre ?? c.title ?? '').toLowerCase().includes(q)) : all;
    if (!list.length)
        return q ? `No channels match "${q}".` : 'No channels returned.';
    return `SomaFM channels (${list.length}):\n` +
        list.slice(0, 30).map((c, i) => `${i + 1}. ${c.id} - ${c.title} [${c.genre ?? 'n/a'}]`).join('\n');
}
export async function channel(args) {
    const id = (args.id ?? '').trim();
    if (!id)
        return 'Provide a channel id.';
    const all = await fetchChannels();
    const c = all.find((x) => x.id === id);
    if (!c)
        return `No channel with id "${id}".`;
    const streams = (c.playlists ?? []).filter((p) => p.format === 'mp3').slice(0, 3);
    return [
        `${c.title} (${c.id})`,
        c.genre ? `Genre: ${c.genre}` : null,
        c.description ? `Description: ${c.description}` : null,
        c.listeners ? `Listeners: ${c.listeners}` : null,
        c.lastPlaying ? `Now playing: ${c.lastPlaying}` : null,
        c.image ? `Image: ${c.image}` : null,
        streams.length ? `Streams:\n${streams.map((s) => `  ${s.quality ?? 'n/a'} - ${s.url}`).join('\n')}` : null,
    ].filter(Boolean).join('\n');
}
function songTime(seconds) {
    const n = Number(seconds);
    if (!Number.isFinite(n) || n <= 0)
        return "time not reported";
    return new Date(n * 1000).toISOString().slice(0, 16).replace("T", " ");
}
