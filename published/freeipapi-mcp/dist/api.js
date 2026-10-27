const BASE = 'https://freeipapi.com/api/json';
const UA = 'mrfentmen-freeipapi-mcp/1.0 (https://github.com/mrfentmen)';
export class FreeipapiError extends Error {
}
async function get(url) {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
    if (!res.ok)
        throw new FreeipapiError(`freeipapi returned ${res.status}`);
    return (await res.json());
}
function format(d) {
    const s = (k) => (d[k] != null ? String(d[k]) : '?');
    return [
        `IP: ${s('ipAddress')} (v${s('ipVersion')})`,
        `Location: ${s('cityName')}, ${s('regionName')}, ${s('countryName')} (${s('countryCode')})`,
        `Coordinates: ${s('latitude')}, ${s('longitude')}`,
        `Zip: ${s('zipCode')} | Timezone: ${s('timeZone')}`,
        `ISP: ${s('isp')} | Organization: ${s('organization')}`,
        s('isProxy') === 'true' ? 'Flagged as proxy/VPN' : 'Not flagged as proxy',
    ].join('\n');
}
export async function lookup(args) {
    const ip = (args.ip ?? '').trim();
    if (ip && !/^(\d{1,3}\.){3}\d{1,3}$/.test(ip))
        throw new FreeipapiError('Provide a valid IPv4 address');
    const d = await get(ip ? `${BASE}/${encodeURIComponent(ip)}` : BASE);
    return format(d);
}
export async function current(_args = {}) {
    const d = await get(BASE);
    return format(d);
}
// ---- muxB tools:
function fiGet(url) {
    return get(url);
}
function fiList(value, max = 12) {
    if (!Array.isArray(value) || !value.length)
        return 'not reported';
    const items = value.slice(0, max).map((v) => String(v));
    const extra = value.length - items.length;
    return items.join(', ') + (extra > 0 ? `, and ${extra} more` : '');
}
function fiText(d, key) {
    const v = d[key];
    return v != null && String(v).trim() ? String(v) : 'not reported';
}
