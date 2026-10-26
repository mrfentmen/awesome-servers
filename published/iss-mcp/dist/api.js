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
