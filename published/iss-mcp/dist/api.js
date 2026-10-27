const m0 = (() => {
    const UA = "mrfentmen-iss-mcp/1.0 (https://github.com/mrfentmen)";
    class IssError extends Error {
    }
    async function get(url) {
        const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(25000) });
        if (!res.ok)
            throw new IssError(`ISS API error ${res.status}`);
        return (await res.json());
    }
    async function issNow(_args) {
        const d = await get("https://api.wheretheiss.at/v1/satellites/25544");
        const when = new Date((d.timestamp ?? Date.now()) * 1000).toISOString();
        return `ISS position at ${when}\nLatitude: ${d.latitude?.toFixed(4)}\nLongitude: ${d.longitude?.toFixed(4)}\nAltitude: ${Math.round(d.altitude ?? 0)} km\nVelocity: ${Math.round(d.velocity ?? 0)} km/h\nVisibility: ${d.visibility ?? ""}\nFootprint: ${Math.round(d.footprint ?? 0)} km`;
    }
    async function issPasses(args) {
        const lat = args.lat ?? 0;
        const lon = args.lon ?? 0;
        if (!lat && !lon)
            throw new IssError("Provide lat and lon");
        const days = Math.min(args.days ?? 3, 10);
        const d = await get(`https://api.wheretheiss.at/v1/satellites/25544/positions?timestamps=${Array.from({ length: days * 24 }, (_, i) => Math.floor(Date.now() / 1000) + i * 3600).join(",")}`);
        const rows = (d ?? []).slice(0, 20);
        const near = rows.filter((r) => {
            const dist = Math.hypot(Number(r.latitude) - lat, Number(r.longitude) - lon);
            return dist < 30;
        });
        return `${rows.length} position samples over ${days} days\nClosest approach estimated ${near.length ? "near your location" : "not within 30 degrees"}\nFirst: ${rows[0]?.timestamp ? new Date(rows[0].timestamp * 1000).toISOString() : ""}\nLast: ${rows[rows.length - 1]?.timestamp ? new Date(rows[rows.length - 1].timestamp * 1000).toISOString() : ""}`;
    }
    return { IssError, issNow, issPasses };
})();
const m1 = (() => {
    const BASE = 'https://api.wheretheiss.at/v1/satellites/25544';
    async function position(_args = {}) {
        const res = await fetch(BASE, {
            headers: { 'User-Agent': 'mrfentmen-iss-position-mcp/1.0', Accept: 'application/json' },
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok)
            throw new Error(`Where The ISS At returned ${res.status}`);
        const d = (await res.json());
        const lines = [
            `ISS position:`,
            `Latitude: ${d.latitude}`,
            `Longitude: ${d.longitude}`,
            `Altitude: ${Number(d.altitude ?? 0).toFixed(1)} km`,
            `Velocity: ${Number(d.velocity ?? 0).toFixed(1)} km/h`,
            `Visibility: ${d.visibility}`,
            `Timestamp: ${d.timestamp ? new Date(Number(d.timestamp) * 1000).toISOString() : 'n/a'}`,
        ];
        if (typeof d.latitude === 'number' && typeof d.longitude === 'number') {
            lines.push(`Map: https://www.openstreetmap.org/?mlat=${d.latitude}&mlon=${d.longitude}#map=4/${d.latitude}/${d.longitude}`);
        }
        return lines.join('\n');
    }
    return { position };
})();
export const IssError = m0.IssError;
export const issNow = m0.issNow;
export const issPasses = m0.issPasses;
export const position = m1.position;
export const m0_issPasses = m0.issPasses;
export const m0_IssError = m0.IssError;
export const m0_issNow = m0.issNow;
export const m1_position = m1.position;
const NOMINATIM = 'https://nominatim.openstreetmap.org';
const NOMINATIM_UA = 'mrfentmen-iss-mcp/1.0 (https://github.com/mrfentmen)';
async function mapJson(url, label) {
    const res = await fetch(url, {
        headers: { 'User-Agent': NOMINATIM_UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    }).catch((e) => {
        throw new IssError(`${label} could not be reached: ${e instanceof Error ? e.message : String(e)}`);
    });
    if (res.status === 403 || res.status === 429)
        throw new IssError(`${label} rate-limited the lookup; wait a second and retry.`);
    if (!res.ok)
        throw new IssError(`${label} returned ${res.status}`);
    return (await res.json());
}
async function reversePlace(lat, lon) {
    const qs = new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
        format: 'jsonv2',
        addressdetails: '1',
        zoom: '10',
    });
    return mapJson(`${NOMINATIM}/reverse?${qs.toString()}`, 'OpenStreetMap');
}
function placeName(place) {
    const a = place?.address ?? {};
    const local = place?.name || a.city || a.town || a.village || a.hamlet || a.county || a.state_district || a.state;
    if (!local)
        return 'open water';
    const country = a.country ?? null;
    return country && country !== local ? `${local}, ${country}` : String(local);
}
/** What the station is over right now, reverse geocoded from its live position. */
export async function issGroundTrack() {
    const d = await mapJson('https://api.wheretheiss.at/v1/satellites/25544', 'Where The ISS At');
    const lat = Number(d.latitude);
    const lon = Number(d.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon))
        throw new IssError('Where The ISS At returned no usable coordinates.');
    const when = d.timestamp ? new Date(Number(d.timestamp) * 1000).toISOString() : new Date().toISOString();
    let place = null;
    let placeNote = '';
    try {
        place = await reversePlace(lat, lon);
    }
    catch (e) {
        placeNote = ` Reverse geocoding failed: ${e instanceof Error ? e.message : String(e)}`;
    }
    const over = place ? placeName(place) : 'open water (no place name at this point)';
    const a = place?.address ?? {};
    const region = [a.state, a.country].filter(Boolean).join(', ');
    const lines = [
        `The ISS is over ${over} at ${when}.`,
        `Position ${lat.toFixed(4)}, ${lon.toFixed(4)} | altitude ${Math.round(Number(d.altitude ?? 0))} km | speed ${Math.round(Number(d.velocity ?? 0))} km/h`,
        region ? `Region: ${region}` : '',
        place?.display_name ? `Name in OpenStreetMap: ${place.display_name}` : '',
        `Map: https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=4/${lat}/${lon}`,
        placeNote ? placeNote.trim() : '',
    ].filter(Boolean);
    return lines.join('\n');
}
/** A place name to coordinates, so iss_passes can be asked about a town. */
export async function resolvePlace(place, limit) {
    const q = String(place ?? '').trim();
    if (!q)
        throw new IssError('Give a place name, e.g. Reykjavik.');
    const n = Math.min(Math.max(Number(limit ?? 3) || 3, 1), 10);
    const qs = new URLSearchParams({ q, format: 'jsonv2', addressdetails: '1', limit: String(n) });
    const rows = await mapJson(`${NOMINATIM}/search?${qs.toString()}`, 'OpenStreetMap');
    if (!Array.isArray(rows) || !rows.length)
        throw new IssError(`OpenStreetMap found no place called "${q}".`);
    const lines = rows.slice(0, n).map((r, i) => {
        const lat = Number(r.lat);
        const lon = Number(r.lon);
        const kind = [r.type, r.category].filter(Boolean).join(' / ');
        return `${i + 1}. ${r.display_name ?? r.name ?? q} (${kind || 'place'}) — lat ${lat}, lon ${lon}`;
    });
    lines.push('', `Pass these numbers to iss_passes as lat and lon.`);
    return lines.join('\n');
}
