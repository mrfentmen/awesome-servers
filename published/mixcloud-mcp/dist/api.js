const BASE = 'https://api.mixcloud.com';
const UA = 'mrfentmen-mixcloud-mcp/1.0 (https://github.com/mrfentmen)';
export class MixcloudError extends Error {
}
async function get(url) {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(25000) });
    if (!res.ok)
        throw new MixcloudError(`Mixcloud returned ${res.status}`);
    return (await res.json());
}
export async function search(args) {
    const q = (args.query ?? '').trim();
    if (!q)
        throw new MixcloudError('Provide a search query');
    const limit = Math.max(1, Math.min(args.limit ?? 8, 20));
    const d = await get(`${BASE}/search/?q=${encodeURIComponent(q)}&type=cloudcast&limit=${limit}`);
    const data = d.data ?? [];
    if (!data.length)
        return `No cloudcasts found for "${q}".`;
    return `Mixcloud cloudcasts for "${q}" (${data.length} shown):\n` + data.map((c, i) => {
        const mins = c.audio_length ? `${Math.floor(c.audio_length / 3600)}h${Math.floor((c.audio_length % 3600) / 60)}m` : '?';
        return `${i + 1}. ${c.name ?? '?'}\n   by ${c.user?.name ?? '?'} | ${mins} | ${(c.created_time ?? '').slice(0, 10)}\n   ${c.url ?? ''}`;
    }).join('\n');
}
export async function user(args) {
    const user = (args.user ?? '').trim();
    if (!user)
        throw new MixcloudError('Provide a user name');
    const d = await get(`${BASE}/${encodeURIComponent(user)}/`);
    return [
        `${d.name ?? user}`,
        d.bio ?? '',
        d.city ? `Location: ${d.city}${d.country ? `, ${d.country}` : ''}` : null,
        `Cloudcasts: ${d.cloudcast_count ?? '?'} | Followers: ${d.follower_count ?? '?'} | Following: ${d.following_count ?? '?'}`,
        d.url ?? '',
    ].filter(Boolean).join('\n');
}
