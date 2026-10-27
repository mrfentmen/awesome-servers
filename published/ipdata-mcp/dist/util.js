/**
 * Pure helpers for ipdata-mcp: IP validation, URL building and response
 * shaping. No network calls and no process.env reads here - unit-tested
 * directly from tests/util.test.js against the built dist/.
 */
const IPV4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
// Loose IPv6 check: hex groups and colons only, v4-mapped endings allowed and
// re-checked against the IPv4 pattern per group.
const IPV6_CHARS = /^[0-9A-Fa-f:.]+$/;
export function isValidIp(ip) {
    if (IPV4.test(ip))
        return true;
    if (!ip.includes(':') || !IPV6_CHARS.test(ip))
        return false;
    const groups = ip.split(':');
    if (groups.length < 3)
        return false;
    for (const group of groups) {
        if (group === '')
            continue; // :: compression
        if (group.includes('.')) {
            if (!IPV4.test(group))
                return false;
            continue;
        }
        if (!/^[0-9A-Fa-f]{1,4}$/.test(group))
            return false;
    }
    return true;
}
/** Trim + validate one IP; throws with a caller-friendly message. */
export function validateLookupIp(ip) {
    const trimmed = ip.trim();
    if (!isValidIp(trimmed))
        throw new Error(`not a valid IP address: ${ip}`);
    return trimmed;
}
export const BULK_MAX = 50;
/** Validate, trim and de-duplicate a bulk list; throws on the first bad entry. */
export function validateBulkIps(ips) {
    if (!Array.isArray(ips) || ips.length === 0) {
        throw new Error('ips must be a non-empty array of IP addresses');
    }
    const seen = new Set();
    const out = [];
    for (const raw of ips) {
        if (typeof raw !== 'string')
            throw new Error(`not a valid IP address: ${String(raw)}`);
        const ip = validateLookupIp(raw);
        if (!seen.has(ip)) {
            seen.add(ip);
            out.push(ip);
        }
    }
    if (out.length > BULK_MAX) {
        throw new Error(`bulk lookup supports at most ${BULK_MAX} unique IPs (got ${out.length})`);
    }
    return out;
}
function host(eu) {
    return eu ? 'https://eu-api.ipdata.co' : 'https://api.ipdata.co';
}
/** Single lookup URL; an empty/undefined ip hits the caller's own IP. */
export function buildLookupUrl(ip, apiKey, eu) {
    const path = ip ? `/${encodeURIComponent(ip)}` : '';
    return `${host(eu)}${path}?api-key=${encodeURIComponent(apiKey)}`;
}
export function buildBulkUrl(apiKey, eu) {
    return `${host(eu)}/bulk?api-key=${encodeURIComponent(apiKey)}`;
}
/** Keep only the named top-level fields; no filter means pass everything. */
export function pickFields(data, fields) {
    if (!fields || fields.length === 0)
        return data;
    const out = {};
    for (const field of fields) {
        if (field in data)
            out[field] = data[field];
    }
    return out;
}
/**
 * Small fraud-triage view of one lookup: location line plus the threat,
 * ASN, company, carrier and VPN blocks an agent actually asks about.
 */
export function threatSummary(data) {
    const rec = data;
    return {
        ip: rec.ip,
        location: {
            city: rec.city,
            region: rec.region,
            country_name: rec.country_name,
            country_code: rec.country_code,
            time_zone: rec.time_zone?.name,
        },
        threat: rec.threat ?? {},
        asn: rec.asn ?? {},
        company: rec.company ?? {},
        carrier: rec.carrier ?? {},
        vpn: rec.vpn ?? {},
    };
}
/**
 * Named top-level field whitelists the sliced tools use. Every entry is a
 * real block in the ipdata response; the tools just keep the answer small
 * for the caller. Each set starts with `ip` so rows stay self-describing.
 */
export const FIELD_SETS = {
    location: [
        'ip', 'city', 'region', 'region_code', 'country_name', 'country_code',
        'continent_name', 'continent_code', 'latitude', 'longitude', 'postal', 'time_zone',
    ],
    timezone: ['ip', 'time_zone'],
    currency: ['ip', 'currency'],
    languages: ['ip', 'languages'],
    carrier: ['ip', 'carrier'],
    asn: ['ip', 'asn'],
    company: ['ip', 'company'],
    threat: ['ip', 'threat'],
    vpn: ['ip', 'vpn'],
};
/**
 * Bulk answers come back as an array of profiles (some responses nest them
 * under `results`). Reduce to the light rows the bulk_country tool returns.
 */
export function bulkCountryRows(data) {
    const rows = Array.isArray(data)
        ? data
        : typeof data === 'object' && data !== null && Array.isArray(data.results)
            ? (data.results)
            : null;
    if (rows === null)
        throw new Error('unexpected bulk response shape; nothing to reduce');
    return rows.map((row) => {
        const r = (row ?? {});
        return { ip: r.ip, country_code: r.country_code };
    });
}
