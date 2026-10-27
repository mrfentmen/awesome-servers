const BASE = 'https://freegeoip.app/json';
const UA = 'mrfentmen-freegeoip-mcp/1.0';
export async function lookup(args) {
    const ip = (args.ip ?? '').trim();
    if (!ip)
        return 'Provide an IP address.';
    const res = await fetch(`${BASE}/${encodeURIComponent(ip)}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`FreeGeoIP returned ${res.status}`);
    const d = (await res.json());
    const get = (k) => String(d[k] ?? '?');
    return [
        `FreeGeoIP for ${ip}:`,
        `Country: ${get('country_name')} (${get('country_code')})`,
        `Region: ${get('region_name')} | City: ${get('city')}`,
        `Latitude: ${get('latitude')} | Longitude: ${get('longitude')}`,
        d.zip_code ? `ZIP: ${get('zip_code')}` : null,
        d.time_zone ? `Timezone: ${get('time_zone')}` : null,
    ].filter(Boolean).join('\n');
}
// ---- gap2a tools:
const IPWHO_BASE = 'https://ipwho.is';
const RDAP_BASE = 'https://rdap.org/ip';
const GEOCODE_BASE = 'https://geocoding-api.open-meteo.com/v1/search';
const REVERSE_BASE = 'https://nominatim.openstreetmap.org/reverse';
const ZONE_BASE = 'https://timeapi.io/api/TimeZone/coordinate';
async function getJson(url, what) {
    const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
        // timeapi.io answers an impossible coordinate with a one-line sentence that
        // says which bound was broken, so keep a short slice of it.
        const detail = (await res.text().catch(() => '')).trim().slice(0, 80);
        throw new Error(detail ? `${what} returned ${res.status}: ${detail}` : `${what} returned ${res.status}`);
    }
    try {
        return (await res.json());
    }
    catch {
        throw new Error(`${what} returned a body that is not JSON`);
    }
}
/** Keeps a user-supplied number inside the range the API will accept. */
function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
}
function point(args) {
    const latitude = Number(args.latitude);
    const longitude = Number(args.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error('Give a numeric latitude and longitude.');
    }
    const lat = clamp(latitude, -90, 90);
    const lon = clamp(longitude, -180, 180);
    const note = lat === latitude && lon === longitude
        ? ''
        : `Coordinates clamped to the valid range (asked for ${latitude}, ${longitude}).`;
    return { lat, lon, note };
}
function formatOffset(seconds) {
    const total = Math.abs(Math.round(seconds / 60));
    const pad = (n) => String(n).padStart(2, '0');
    return `${seconds < 0 ? '-' : '+'}${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}
/** The first address in a jCard, which is how RDAP carries a contact mailbox. */
function vcardEmail(vcard) {
    if (!Array.isArray(vcard))
        return undefined;
    for (const entry of vcard) {
        if (!Array.isArray(entry) || entry[0] !== 'email')
            continue;
        for (const value of entry.slice(1)) {
            if (typeof value === 'string' && value.includes('@'))
                return value;
        }
    }
    return undefined;
}
/** Abuse contacts sit at any depth, so the whole entity tree is searched. */
function findAbuseContact(entities) {
    for (const entity of entities) {
        if ((entity.roles ?? []).includes('abuse')) {
            return { handle: entity.handle, email: vcardEmail(entity.vcardArray) };
        }
        const nested = findAbuseContact(entity.entities ?? []);
        if (nested)
            return nested;
    }
    return null;
}
export async function ipNetwork(args) {
    const ip = (args.ip ?? '').trim();
    if (!ip)
        return 'Provide an IP address.';
    const d = await getJson(`${IPWHO_BASE}/${encodeURIComponent(ip)}`, 'ipwho.is');
    if (d.success === false)
        throw new Error(`ipwho.is has no record for ${ip}: ${d.message ?? 'not found'}`);
    const c = d.connection;
    if (!c)
        return `ipwho.is reports no network details for ${ip}.`;
    return [
        `Network for ${ip}:`,
        c.asn ? `ASN: AS${c.asn}` : 'ASN: not reported',
        c.org ? `Organisation: ${c.org}` : 'Organisation: not reported',
        c.isp ? `ISP: ${c.isp}` : 'ISP: not reported',
        c.domain ? `Domain: ${c.domain}` : 'Domain: not reported',
        d.calling_code ? `Dialling code: +${d.calling_code}` : '',
    ].filter(Boolean).join('\n');
}
export async function reverseGeocode(args) {
    const { lat, lon, note } = point(args);
    const d = await getJson(`${REVERSE_BASE}?${new URLSearchParams({ format: 'jsonv2', lat: String(lat), lon: String(lon), zoom: '10' })}`, 'OpenStreetMap Nominatim');
    if (d.error)
        throw new Error(`OpenStreetMap Nominatim has no place at ${lat}, ${lon}: ${d.error}`);
    const a = d.address ?? {};
    const where = [a.city ?? a.town ?? a.village ?? a.county, a.state, a.country].filter(Boolean).join(', ');
    const box = d.boundingbox;
    return [
        `Reverse geocode of ${lat}, ${lon}:`,
        d.display_name ? d.display_name.slice(0, 240) : 'no place name reported',
        where ? `Address: ${where}` : '',
        d.addresstype ? `Place type: ${d.addresstype}` : '',
        d.osm_type && d.osm_id ? `OpenStreetMap: ${d.osm_type}/${d.osm_id}` : '',
        box?.length === 4 ? `Bounds: south ${box[0]}, north ${box[1]}, west ${box[2]}, east ${box[3]}` : '',
        note,
    ].filter(Boolean).join('\n');
}
export async function timezoneAt(args) {
    const { lat, lon, note } = point(args);
    const d = await getJson(`${ZONE_BASE}?${new URLSearchParams({ latitude: String(lat), longitude: String(lon) })}`, 'timeapi.io');
    const current = d.currentUtcOffset?.seconds;
    const standard = d.standardUtcOffset?.seconds;
    return [
        `Time zone at ${lat}, ${lon}:`,
        d.timeZone ? `IANA zone: ${d.timeZone}` : 'IANA zone: not reported',
        d.currentLocalTime ? `Local time now: ${d.currentLocalTime.replace('T', ' ').slice(0, 19)}` : '',
        current !== undefined ? `UTC offset now: ${formatOffset(current)}` : 'UTC offset now: not reported',
        standard !== undefined ? `Standard UTC offset: ${formatOffset(standard)}` : '',
        d.hasDayLightSaving
            ? `Daylight saving: observed${d.isDayLightSavingActive ? ', active now' : ''}`
            : 'Daylight saving: not reported',
        d.dstInterval?.dstName ? `Daylight saving name: ${d.dstInterval.dstName}` : '',
        d.dstInterval?.dstEnd ? `Daylight saving ends: ${d.dstInterval.dstEnd.slice(0, 10)}` : '',
        note,
    ].filter(Boolean).join('\n');
}
