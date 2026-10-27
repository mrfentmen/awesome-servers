const BASE = 'https://peertube.tv/api/v1';
const UA = 'mrfentmen-peertube-mcp/1.0 (https://github.com/mrfentmen)';
export class PeertubeError extends Error {
}
async function get(url) {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(25000) });
    if (!res.ok)
        throw new PeertubeError(`PeerTube returned ${res.status}`);
    return (await res.json());
}
export async function searchVideos(args) {
    const q = (args.query ?? '').trim();
    if (!q)
        throw new PeertubeError('Provide a search query');
    const limit = Math.max(1, Math.min(args.limit ?? 8, 25));
    const d = await get(`${BASE}/search/videos?search=${encodeURIComponent(q)}&start=0&count=${limit}`);
    const videos = d.data ?? [];
    if (!videos.length)
        return `No videos found for "${q}".`;
    return `PeerTube videos for "${q}" (${d.total ?? videos.length} total, ${videos.length} shown):\n` + videos.map((v, i) => {
        const mins = v.duration ? `${Math.floor(v.duration / 60)}m${String(v.duration % 60).padStart(2, '0')}s` : '?';
        return `${i + 1}. ${v.name ?? '?'}\n   ${mins} | ${v.views ?? 0} views | ${v.category?.label ?? ''}\n   ${v.url ?? ''}`;
    }).join('\n');
}
export async function instance(_args = {}) {
    const d = await get(`${BASE}/config`);
    const inst = d.instance ?? {};
    return [
        `PeerTube.tv: ${inst.name ?? '?'}`,
        (inst.shortDescription ?? inst.description ?? '').slice(0, 300),
        `Server version: ${d.serverVersion ?? '?'}`,
    ].filter(Boolean).join('\n');
}
// ---- muxB tools:
const SORTS = {
    trending: '-trending',
    views: '-views',
    likes: '-likes',
    published: '-publishedAt',
    duration: '-duration',
};
