/**
 * AlienVault OTX API v2 client. Needs OTX_API_KEY
 * (free at https://otx.alienvault.com/, Settings > API Integration).
 * Docs: https://otx.alienvault.com/api
 */
const BASE = "https://otx.alienvault.com/api/v1";
export class OtxError extends Error {
}
function headers() {
    const key = process.env.OTX_API_KEY;
    if (!key)
        throw new OtxError("Set OTX_API_KEY first (free at otx.alienvault.com, Settings).");
    return { "User-Agent": "otx-mcp/1.0", Accept: "application/json", "X-OTX-API-KEY": key };
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: headers(),
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 401 || res.status === 403)
        throw new OtxError("OTX refused (401/403). Check API key.");
    if (res.status === 404)
        throw new OtxError("Not found.");
    if (!res.ok)
        throw new OtxError(`OTX error ${res.status}`);
    return (await res.json());
}
export async function searchPulses(query, limit = 5) {
    if (!query.trim())
        throw new OtxError("Query is empty.");
    const data = await getJson(`/search/pulses/?q=${encodeURIComponent(query.trim())}&limit=${Math.min(Math.max(limit, 1), 50)}`);
    const rows = Array.isArray(data.results) ? data.results : [];
    return rows.slice(0, limit).map((p) => ({
        id: p.id,
        name: p.name,
        author: p.author_name,
        indicators: typeof p.indicator_count === "number" ? p.indicator_count : undefined,
        modified: p.modified ? String(p.modified).slice(0, 10) : undefined,
    }));
}
export async function pulseIndicators(id, limit = 10) {
    if (!id.trim())
        throw new OtxError("Pulse id is empty.");
    const data = await getJson(`/pulses/${encodeURIComponent(id.trim())}/indicators?limit=${Math.min(Math.max(limit, 1), 100)}`);
    const rows = Array.isArray(data.results) ? data.results : [];
    return rows.slice(0, limit).map((i) => `${String(i.indicator ?? "?")} [${String(i.type ?? "?")}]`);
}
export async function ipReputation(ip) {
    if (!ip.trim())
        throw new OtxError("IP is empty.");
    const data = await getJson(`/indicators/IPv4/${encodeURIComponent(ip.trim())}/general`);
    const lines = [
        `${ip.trim()}`,
        data.reputation !== undefined ? `Reputation: ${data.reputation}` : "",
        data.country_code ? `Country: ${data.country_code}${data.asn ? ` (${data.asn})` : ""}` : "",
        Array.isArray(data.pulse_info?.pulses) && data.pulse_info.pulses.length
            ? `In ${data.pulse_info.pulses.length} pulses, e.g. ${data.pulse_info.pulses.slice(0, 3).map((p) => String(p.name ?? p.id)).join("; ")}`
            : "In no pulses",
    ].filter(Boolean);
    return lines.join("\n");
}
export function formatPulse(p, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    return `${prefix}[${p.id ?? "?"}] ${p.name ?? "(unnamed)"}${p.author ? ` by ${p.author}` : ""}${p.indicators !== undefined ? ` (${p.indicators} indicators)` : ""}${p.modified ? ` — ${p.modified}` : ""}`;
}
// ---- muxQ tools:
// OTX asks for an API key on most of its v1 surface, but not on the indicator
// lookups. /indicators/<type>/<value>/general answers an anonymous caller with
// HTTP 200 and the full record - reputation, ASN, country, malware stats and
// pulse membership - and /url_list comes back the same way. Those two are what
// the three tools below read, so all of them work with no OTX_API_KEY set.
const OTX_IND = 'https://otx.alienvault.com/api/v1/indicators';
const OTX_UA = 'otx-mcp/1.1';
const OTX_LIST_MAX = 25;
async function otxGet(path) {
    const res = await fetch(`${OTX_IND}${path}`, {
        headers: { 'User-Agent': OTX_UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 401 || res.status === 403)
        throw new Error('OTX refused the request (401/403).');
    if (res.status === 404)
        throw new Error('OTX has no record for that indicator.');
    if (!res.ok)
        throw new Error(`OTX error ${res.status}`);
    const data = (await res.json());
    if (!data || typeof data !== 'object')
        throw new Error('OTX returned an empty body.');
    return data;
}
function num(value) {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
function str(value) {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
}
function cap(value, fallback, max) {
    const n = typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : fallback;
    return Math.min(max, Math.max(1, n));
}
/** Full OTX record for any indicator type: IP, domain, hostname, file hash, CVE. */
export async function indicatorReport(args) {
    const indicator = (args.indicator ?? '').trim();
    const type = (args.type ?? '').trim();
    if (!indicator)
        throw new Error('An indicator is required, for example 8.8.8.8 or a sha256 hash.');
    if (!type)
        throw new Error('An indicator type is required: IPv4, IPv6, domain, hostname, file, CVE or URL.');
    const allowed = ['IPv4', 'IPv6', 'domain', 'hostname', 'file', 'CVE', 'URL'];
    if (!allowed.includes(type)) {
        throw new Error(`Type "${type}" is not one of: ${allowed.join(', ')}.`);
    }
    const data = await otxGet(`/${type}/${encodeURIComponent(indicator)}/general`);
    const reputation = num(data.reputation);
    const pulseCount = data.pulse_info?.count;
    const asn = num(data.asn);
    const asnName = str(data.asn_name);
    const country = str(data.country_code);
    const city = str(data.city);
    const malware = data.malware?.count;
    const lines = [
        `${type} indicator: ${indicator}`,
        `OTX type: ${str(data.type) ?? 'not reported'}`,
        `Reputation: ${reputation !== null ? reputation : 'not reported'}`,
        `Pulses containing it: ${num(pulseCount) !== null ? pulseCount : 'not reported'}`,
        `Malware associations: ${num(malware) !== null ? malware : 'not reported'}`,
        `Autonomous system: ${asn !== null || asnName ? `${asn ?? 'not reported'}${asnName ? ` (${asnName})` : ''}` : 'not reported'}`,
        `Country: ${country ?? 'not reported'}`,
        `City: ${city ?? 'not reported'}`,
        `Whois: ${str(data.whois) ?? 'not reported'}`,
    ];
    const geo = data.geo;
    if (geo && typeof geo === 'object') {
        const lat = num(geo.latitude);
        const lon = num(geo.longitude);
        if (lat !== null || lon !== null) {
            lines.push(`Coordinates: ${lat !== null ? lat.toFixed(4) : 'not reported'}, ${lon !== null ? lon.toFixed(4) : 'not reported'}`);
        }
    }
    const created = str(data.created);
    const modified = str(data.modified);
    if (created)
        lines.push(`First seen: ${created.slice(0, 10)}`);
    if (modified)
        lines.push(`Last seen: ${modified.slice(0, 10)}`);
    return lines.join('\n');
}
/** The community pulses an indicator belongs to, newest first. */
export async function indicatorPulses(args) {
    const indicator = (args.indicator ?? '').trim();
    const type = (args.type ?? '').trim();
    if (!indicator)
        throw new Error('An indicator is required.');
    if (!type)
        throw new Error('An indicator type is required: IPv4, IPv6, domain, hostname or file.');
    const limit = cap(args.limit, 10, OTX_LIST_MAX);
    const data = await otxGet(`/${type}/${encodeURIComponent(indicator)}/general`);
    const info = data.pulse_info ?? {};
    const rows = Array.isArray(info.pulses) ? info.pulses : [];
    if (!rows.length)
        return `"${indicator}" is not in any OTX pulse.`;
    const total = num(info.count) ?? rows.length;
    return (`"${indicator}" is in ${total} OTX pulses, showing ${Math.min(limit, rows.length)}:\n` +
        rows
            .slice(0, limit)
            .map((p) => {
            const name = str(p.name) ?? str(p.id) ?? 'unnamed pulse';
            const author = str(p.author_name);
            const created = str(p.created);
            const tags = Array.isArray(p.tags) ? p.tags.filter((t) => typeof t === 'string') : [];
            const parts = [author ? `by ${author}` : 'author not reported'];
            if (created)
                parts.push(created.slice(0, 10));
            if (tags.length)
                parts.push(`tags: ${tags.slice(0, 5).join(', ')}`);
            return `* ${name} (${parts.join(', ')})`;
        })
            .join('\n'));
}
/** URLs an indicator has been seen hosting or talking to. */
export async function indicatorUrls(args) {
    const indicator = (args.indicator ?? '').trim();
    const type = (args.type ?? '').trim();
    if (!indicator)
        throw new Error('An indicator is required.');
    if (!type)
        throw new Error('An indicator type is required: IPv4, IPv6, domain or hostname.');
    const limit = cap(args.limit, 10, OTX_LIST_MAX);
    const data = await otxGet(`/${type}/${encodeURIComponent(indicator)}/url_list?limit=${limit}`);
    const rows = Array.isArray(data.url_list) ? data.url_list : [];
    if (!rows.length)
        return `No URLs are recorded for "${indicator}".`;
    return (`URLs recorded for "${indicator}" (${rows.length}):\n` +
        rows
            .slice(0, limit)
            .map((u) => {
            const url = str(u.url) ?? 'url not reported';
            const host = str(u.hostname) ?? str(u.domain) ?? 'host not reported';
            const date = str(u.date);
            return `* ${url} | host ${host}${date ? ` | ${date.slice(0, 10)}` : ''}`;
        })
            .join('\n'));
}
