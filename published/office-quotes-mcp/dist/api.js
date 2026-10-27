const BASE = 'https://officeapi.akashrajpurohit.com';
const UA = 'mrfentmen-office-quotes-mcp/1.0 (https://github.com/mrfentmen)';
export class OfficeError extends Error {
}
async function get(url) {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
    if (!res.ok)
        throw new OfficeError(`Office API returned ${res.status}`);
    return (await res.json());
}
export async function randomQuote(_args = {}) {
    const d = await get(`${BASE}/quote/random`);
    if (!d.quote)
        throw new OfficeError('Office API returned an empty quote');
    return `"${d.quote}" — ${d.character ?? '?'}`;
}
export async function quoteById(args) {
    const id = Number(args.id);
    if (!Number.isFinite(id) || id <= 0)
        throw new OfficeError('Provide a quote id');
    const d = await get(`${BASE}/quote/${id}`);
    if (!d.quote)
        throw new OfficeError(`Quote ${id} not found`);
    return `"${d.quote}" — ${d.character ?? '?'}`;
}
// ---- muxB tools:
const TVMAZE = 'https://api.tvmaze.com';
async function tvmazeGet(path) {
    const res = await fetch(`${TVMAZE}${path}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 404)
        throw new OfficeError('TVmaze has no match for that.');
    if (!res.ok)
        throw new OfficeError(`TVmaze returned ${res.status}`);
    return (await res.json());
}
const stripTags = (v, max) => {
    const t = (v ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!t)
        return 'no summary reported';
    return t.length > max ? `${t.slice(0, max)}...` : t;
};
// ---- gap4a2 tools:
export async function showSeasons(args) {
    const id = Math.max(1, Math.min(Math.trunc(args.show_id), 10000000));
    const limit = Math.max(1, Math.min(Math.trunc(args.limit ?? 15), 50));
    const rows = await tvmazeGet(`/shows/${id}/seasons`);
    return `TVmaze seasons for show ${id} (${rows.length} total):\n` + rows.slice(0, limit).map(s => `Season ${s.number ?? 'not reported'} | episodes ordered ${s.episodeOrder ?? 'not reported'} | ${s.premiereDate ?? 'not reported'} to ${s.endDate ?? 'not reported'}\n${stripTags(s.summary, 250)}`).join('\n');
}
