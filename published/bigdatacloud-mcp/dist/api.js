const UA = 'mrfentmen-bigdatacloud-mcp/1.0';
export async function clientIp(_args) {
    const res = await fetch('https://api.bigdatacloud.net/data/client-ip', {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`BigDataCloud returned ${res.status}`);
    const d = (await res.json());
    if (!d.ipString)
        throw new Error('No IP returned.');
    return `Your IP: ${d.ipString} (${d.ipType ?? '?'})\nGlobally reachable: ${d.isReachableGlobally ?? '?'}`;
}
export async function reverseGeocode(args) {
    const lat = Number(args.lat), lon = Number(args.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon))
        throw new Error('Provide valid lat and lon.');
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`BigDataCloud returned ${res.status}`);
    const d = (await res.json());
    if (!d.countryName)
        throw new Error(`No location for ${lat},${lon}.`);
    return `Location for ${lat},${lon}:\n${[d.locality, d.city, d.principalSubdivision, d.countryName].filter(Boolean).join(', ')}\nCountry: ${d.countryName} (${d.countryCode ?? '?'})\nPostcode: ${d.postcode ?? '?'}\nConfirmed: ${d.latitude ?? '?'}, ${d.longitude ?? '?'}`;
}
async function place(lat, lon) {
    if (!Number.isFinite(lat) || !Number.isFinite(lon))
        throw new Error('Provide valid lat and lon.');
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180)
        throw new Error(`Latitude must be -90 to 90 and longitude -180 to 180, got ${lat},${lon}`);
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`BigDataCloud returned ${res.status}`);
    const d = (await res.json());
    if (!d.countryName)
        throw new Error(`No location for ${lat},${lon}.`);
    return d;
}
function label(p) {
    return [p.city, p.principalSubdivision, p.countryName].filter(Boolean).join(', ') || `${p.latitude},${p.longitude}`;
}
export async function distanceBetween(args) {
    const lat1 = Number(args.lat1), lon1 = Number(args.lon1);
    const lat2 = Number(args.lat2), lon2 = Number(args.lon2);
    if (![lat1, lon1, lat2, lon2].every((n) => Number.isFinite(n))) {
        throw new Error('Provide all four of lat1, lon1, lat2 and lon2.');
    }
    const a = await place(lat1, lon1);
    const b = await place(lat2, lon2);
    // haversine on a spherical earth, which is accurate enough for a distance hint
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371.0088;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const km = 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
    const bearing = (Math.atan2(Math.sin(dLon) * Math.cos(toRad(lat2)), Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon)) * 180) / Math.PI;
    const compass = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
    const dir = compass[Math.round(((bearing + 360) % 360) / 45) % 8];
    return [
        `Great circle distance: ${km.toFixed(1)} km (${(km * 0.621371).toFixed(1)} miles)`,
        `From: ${label(a)} at ${a.latitude}, ${a.longitude}`,
        `To: ${label(b)} at ${b.latitude}, ${b.longitude}`,
        `Initial bearing from the first point: ${((bearing + 360) % 360).toFixed(1)} degrees, heading ${dir}`,
        `Open Location Codes: ${a.plusCode ?? 'not reported'} to ${b.plusCode ?? 'not reported'}`,
        'Distance uses the haversine formula on a sphere of radius 6371.0088 km, so treat it as a close estimate.',
    ].join('\n');
}
