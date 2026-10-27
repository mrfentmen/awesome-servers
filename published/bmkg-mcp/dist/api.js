export class BmkgError extends Error {
    constructor(message) {
        super(message);
        this.name = "BmkgError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
async function authHeaders() {
    return {};
}
function pretty(data) {
    const t = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t;
}
async function req(url, init = {}) {
    const res = await fetch(url, { headers: { ...UA, ...(await authHeaders()), ...(init.headers ?? {}) }, ...init });
    const ct = res.headers.get("content-type") ?? "";
    const data = ct.includes("json") ? await res.json() : await res.text();
    if (!res.ok) {
        const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300);
        throw new BmkgError(`HTTP ${res.status}: ${detail}`);
    }
    return data;
}
export async function getForecast(adm4) {
    let url = `https://api.bmkg.go.id/publik/prakiraan-cuaca`;
    const qs = new URLSearchParams();
    qs.append("adm4", String(adm4));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getFeltEarthquakes() {
    let url = `https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json`;
    const data = await req(url);
    return pretty(data);
}
export async function getLatestEarthquakes() {
    let url = `https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json`;
    const data = await req(url);
    return pretty(data);
}
// ---- gap4a1 tools:
async function warningXml(url) {
    const response = await fetch(url, { headers: { ...UA, Accept: 'application/xml' }, signal: AbortSignal.timeout(20000) });
    if (!response.ok)
        throw new BmkgError(`BMKG warnings returned HTTP ${response.status}`);
    const xml = await response.text();
    if (!/<(?:rss|alert)\b/.test(xml))
        throw new BmkgError('BMKG returned no warning XML');
    return xml;
}
function warningField(xml, name, max = 1200) {
    const value = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`).exec(xml)?.[1];
    if (!value)
        return 'not reported';
    return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim().slice(0, max);
}
export async function warningDetail(args) {
    const url = new URL(args.alertUrl);
    if (url.origin !== 'https://www.bmkg.go.id' || !/^\/alerts\/nowcast\/id\/[A-Za-z0-9_-]+\.xml$/.test(url.pathname) || url.search || url.hash || url.username || url.password)
        throw new BmkgError('Provide a BMKG CAP URL from weather_warnings.');
    const xml = await warningXml(url.href);
    const areas = [...xml.matchAll(/<area>([\s\S]*?)<\/area>/g)].slice(0, 10);
    return [
        warningField(xml, 'headline', 200),
        `ID: ${warningField(xml, 'identifier')} | status: ${warningField(xml, 'status')} | type: ${warningField(xml, 'msgType')}`,
        `Event: ${warningField(xml, 'event')} | urgency: ${warningField(xml, 'urgency')} | severity: ${warningField(xml, 'severity')} | certainty: ${warningField(xml, 'certainty')}`,
        `Sent: ${warningField(xml, 'sent')} | effective: ${warningField(xml, 'effective')} | expires: ${warningField(xml, 'expires')}`,
        warningField(xml, 'description', 1600),
        `Instructions: ${warningField(xml, 'instruction', 1000)}`,
        ...areas.map(a => `Area: ${warningField(a[1], 'areaDesc', 400)}\nBoundary (latitude,longitude): ${warningField(a[1], 'polygon', 2000)}`),
        `Source: ${url.href}`,
    ].join('\n');
}
