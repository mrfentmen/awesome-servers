const m0 = (() => {
    const BASE = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';
    async function recent(args = {}) {
        const res = await fetch(BASE, {
            headers: { 'User-Agent': 'mrfentmen-usgs-earthquakes-mcp/1.0', Accept: 'application/json' },
            signal: AbortSignal.timeout(25000),
        });
        if (!res.ok)
            throw new Error(`USGS returned ${res.status}`);
        const data = (await res.json());
        const minMag = typeof args.minMagnitude === 'number' ? args.minMagnitude : 0;
        const limit = Math.max(1, Math.min(args.limit ?? 15, 50));
        const quakes = (data.features ?? [])
            .filter((f) => f.properties?.mag ?? 0 >= minMag)
            .slice(0, limit);
        if (!quakes.length)
            return 'No earthquakes recorded in the last day.';
        return `Earthquakes in the last day (${quakes.length} shown):\n` +
            quakes
                .map((q, i) => {
                const p = q.properties ?? {};
                const coords = q.geometry?.coordinates ?? [];
                const place = p.place ?? 'unknown location';
                const mag = typeof p.mag === 'number' ? `M${p.mag.toFixed(1)}` : 'no magnitude';
                return `${i + 1}. ${mag} | ${place} | ${p.time ? new Date(Number(p.time)).toISOString().slice(0, 16).replace('T', ' ') : ''}${coords.length ? `\n   lat ${coords[1]} lon ${coords[0]}` : ''}`;
            })
                .join('\n');
    }
    return { recent };
})();
const m1 = (() => {
    const UA = "mrfentmen-earthquake-mcp/1.0 (https://github.com/mrfentmen)";
    const FEEDS = {
        "1": "all_day",
        "7": "all_week",
        "30": "all_month",
    };
    class EarthquakeError extends Error {
    }
    async function get(feed, minMag, limit) {
        const res = await fetch(`https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/${feed}.geojson`, {
            headers: { "User-Agent": UA, Accept: "application/json" },
            signal: AbortSignal.timeout(25000),
        });
        if (!res.ok)
            throw new EarthquakeError(`USGS returned HTTP ${res.status}`);
        const d = (await res.json());
        const out = [];
        for (const f of d.features ?? []) {
            const p = f.properties ?? {};
            const mag = p.mag ?? 0;
            if (mag < minMag)
                continue;
            out.push({ mag, place: p.place, time: p.time, url: p.url, depth: f.geometry?.coordinates?.[2] });
            if (out.length >= limit)
                break;
        }
        return out;
    }
    async function recent(args) {
        const days = String(args.days ?? 1);
        const feed = FEEDS[days];
        if (!feed)
            throw new EarthquakeError("days must be 1, 7, or 30");
        const limit = Math.min(args.limit ?? 10, 50);
        const quakes = await get(feed, args.min_mag ?? 2.5, limit);
        if (!quakes.length)
            return `No earthquakes above magnitude ${args.min_mag ?? 2.5} in the last ${days} day(s)`;
        return quakes.map((q, i) => {
            const d = new Date(q.time).toISOString().slice(0, 16).replace("T", " ");
            return `${i + 1}. M${q.mag.toFixed(1)} | ${q.place} | ${d} | depth ${q.depth ?? "n/a"} km`;
        }).join("\n");
    }
    async function byPlace(args) {
        const place = (args.place ?? "").trim().toLowerCase();
        if (!place)
            throw new EarthquakeError("Provide a place keyword");
        const limit = Math.min(args.limit ?? 10, 50);
        const quakes = await get("all_week", 0, 500);
        const hits = quakes.filter((q) => String(q.place ?? "").toLowerCase().includes(place)).slice(0, limit);
        if (!hits.length)
            return `No earthquakes found for "${args.place}" this week`;
        return hits.map((q, i) => {
            const d = new Date(q.time).toISOString().slice(0, 16).replace("T", " ");
            return `${i + 1}. M${q.mag.toFixed(1)} | ${q.place} | ${d}`;
        }).join("\n");
    }
    return { EarthquakeError, byPlace, recent };
})();
const m2 = (() => {
    /**
     * USGS client. Live earthquake data, keyless. Uses the GeoJSON summary
     * feeds and the FDSN event query endpoint.
     */
    const FEED = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary";
    const QUERY = "https://earthquake.usgs.gov/fdsnws/event/1/query";
    class UsgsError extends Error {
    }
    function mapFeature(f) {
        const p = f.properties ?? {};
        const c = f.geometry?.coordinates ?? [];
        return {
            id: f.id,
            mag: p.mag,
            place: p.place,
            time: p.time ? new Date(p.time).toISOString() : undefined,
            depthKm: c[2] != null ? Math.round(c[2] * 10) / 10 : undefined,
            lat: c[1] != null ? Math.round(c[1] * 100) / 100 : undefined,
            lon: c[0] != null ? Math.round(c[0] * 100) / 100 : undefined,
            url: p.url,
            type: p.type,
        };
    }
    async function latestQuakes(magnitude = "2.5", timeframe = "day", limit = 15) {
        const res = await fetch(`${FEED}/${magnitude}_${timeframe}.geojson`, { signal: AbortSignal.timeout(15000) });
        if (!res.ok)
            throw new UsgsError(`USGS feed error ${res.status}`);
        const d = await res.json();
        return (d.features ?? []).slice(0, limit).map(mapFeature);
    }
    async function queryQuakes(minMagnitude = 4.5, limit = 10, starttime) {
        const params = new URLSearchParams({
            format: "geojson",
            minmagnitude: String(minMagnitude),
            limit: String(Math.min(limit, 50)),
        });
        if (starttime)
            params.set("starttime", starttime);
        const res = await fetch(`${QUERY}?${params}`, { signal: AbortSignal.timeout(15000) });
        if (!res.ok)
            throw new UsgsError(`USGS query error ${res.status}`);
        const d = await res.json();
        return (d.features ?? []).slice(0, limit).map(mapFeature);
    }
    function formatQuake(q) {
        const lines = [
            `M ${q.mag ?? "?"} ${q.place ?? "Unknown place"}`,
            q.time ? `Time: ${q.time}` : "",
            `Depth: ${q.depthKm ?? "?"} km, at ${q.lat ?? "?"}, ${q.lon ?? "?"}`,
            q.url ?? "",
        ].filter(Boolean);
        return lines.join("\n");
    }
    return { UsgsError, formatQuake, latestQuakes, queryQuakes };
})();
export const EarthquakeError = m1.EarthquakeError;
export const UsgsError = m2.UsgsError;
export const byPlace = m1.byPlace;
export const formatQuake = m2.formatQuake;
export const latestQuakes = m2.latestQuakes;
export const queryQuakes = m2.queryQuakes;
export const recent = m0.recent;
export const m0_recent = m0.recent;
export const m1_byPlace = m1.byPlace;
export const m1_EarthquakeError = m1.EarthquakeError;
export const m1_recent = m1.recent;
export const m2_queryQuakes = m2.queryQuakes;
export const m2_UsgsError = m2.UsgsError;
export const m2_formatQuake = m2.formatQuake;
export const m2_latestQuakes = m2.latestQuakes;
// ---- muxB tools:
const FDSN = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
