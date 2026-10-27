const m0 = (() => {
    const BASE = 'https://nominatim.openstreetmap.org';
    async function search(args) {
        const q = (args.query ?? '').trim();
        if (!q)
            return 'Provide a place name.';
        const limit = Math.max(1, Math.min(args.limit ?? 5, 20));
        const url = `${BASE}/search?q=${encodeURIComponent(q)}&format=jsonv2&limit=${limit}`;
        const res = await fetch(url, {
            headers: { 'User-Agent': 'mrfentmen-nominatim-mcp/1.0 (https://github.com/mrfentmen)', Accept: 'application/json' },
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok)
            throw new Error(`Nominatim returned ${res.status}`);
        const rows = (await res.json());
        if (!rows.length)
            return `No places found for "${q}".`;
        return `Places matching "${q}" (${rows.length} shown):\n` +
            rows
                .map((r, i) => `${i + 1}. ${r.display_name ?? 'n/a'}\n   ${r.type ?? ''} | lat ${r.lat} lon ${r.lon}`)
                .join('\n');
    }
    async function reverse(args) {
        if (typeof args.lat !== 'number' || typeof args.lon !== 'number') {
            return 'Provide numeric latitude and longitude.';
        }
        const url = `${BASE}/reverse?lat=${args.lat}&lon=${args.lon}&format=jsonv2`;
        const res = await fetch(url, {
            headers: { 'User-Agent': 'mrfentmen-nominatim-mcp/1.0 (https://github.com/mrfentmen)', Accept: 'application/json' },
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok)
            throw new Error(`Nominatim returned ${res.status}`);
        const d = (await res.json());
        if (!d.display_name)
            return `No address found for ${args.lat}, ${args.lon}.`;
        return `Address for ${args.lat}, ${args.lon}:\n${d.display_name}`;
    }
    return { reverse, search };
})();
const m1 = (() => {
    const BASE = "https://nominatim.openstreetmap.org";
    const UA = "mrfentmen-geocoding-mcp/1.0 (https://github.com/mrfentmen)";
    class GeocodeError extends Error {
    }
    async function get(url) {
        const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
        if (res.status === 429)
            throw new GeocodeError("Nominatim rate limit hit, wait a second and retry");
        if (!res.ok)
            throw new GeocodeError(`Nominatim error ${res.status}`);
        return (await res.json());
    }
    async function geocode(args) {
        const q = (args.query ?? "").trim();
        if (!q)
            throw new GeocodeError("Provide a place name or address");
        const limit = Math.min(args.limit ?? 5, 10);
        const d = await get(`${BASE}/search?q=${encodeURIComponent(q)}&format=json&limit=${limit}&addressdetails=0`);
        if (!d.length)
            return "No results found";
        return d.map((r, i) => {
            const city = r?.address?.city || r?.address?.town || r?.address?.village || "";
            return `${i + 1}. ${r?.display_name ?? "n/a"}\n   ${r?.lat ?? "?"}, ${r?.lon ?? "?"}${city ? ` | ${city}` : ""}`;
        }).join("\n\n");
    }
    async function reverse(args) {
        const lat = args.lat;
        const lon = args.lon;
        if (lat === undefined || lon === undefined || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            throw new GeocodeError("Provide valid latitude and longitude");
        }
        const d = await get(`${BASE}/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`);
        return `${d?.display_name ?? "No address found"}\n\nLatitude: ${d?.lat ?? lat} | Longitude: ${d?.lon ?? lon}\nType: ${d?.type ?? "n/a"} (${d?.category ?? ""})`;
    }
    return { GeocodeError, geocode, reverse };
})();
export const GeocodeError = m1.GeocodeError;
export const geocode = m1.geocode;
export const reverse = m0.reverse;
export const search = m0.search;
export const m0_reverse = m0.reverse;
export const m0_search = m0.search;
export const m1_geocode = m1.geocode;
export const m1_reverse = m1.reverse;
export const m1_GeocodeError = m1.GeocodeError;
// ---- muxC tools:
