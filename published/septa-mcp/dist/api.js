const m0 = (() => {
    const BASE = 'https://www3.septa.org/hackathon';
    async function next(args) {
        const from = (args.from ?? '').trim();
        const to = (args.to ?? '').trim();
        if (!from || !to)
            return 'Provide origin and destination stations.';
        const count = Math.max(1, Math.min(args.count ?? 10, 50));
        const res = await fetch(`${BASE}/NextToArrive/${encodeURIComponent(from)}/${encodeURIComponent(to)}/${count}`, {
            headers: { 'User-Agent': 'mrfentmen-septa-mcp/1.0', Accept: 'application/json' },
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok)
            throw new Error(`SEPTA returned ${res.status}`);
        const d = (await res.json());
        if (!d.length)
            return `No arrivals from ${from} to ${to}.`;
        return `Next arrivals ${from} -> ${to}:\n` +
            d.map((r, i) => {
                const s = (k) => (r[k] != null ? String(r[k]) : '');
                return `${i + 1}. ${s('orig_train')} departs ${s('orig_departure_time')}${s('orig_delay') !== '0' ? ` (delay ${s('orig_delay')}m)` : ''} on ${s('orig_line')}`;
            }).join('\n');
    }
    async function stops(args) {
        const route = (args.route ?? '').trim();
        if (!route)
            return 'Provide a route id.';
        const res = await fetch(`${BASE}/Stops/${encodeURIComponent(route)}`, {
            headers: { 'User-Agent': 'mrfentmen-septa-mcp/1.0', Accept: 'application/json' },
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok)
            throw new Error(`SEPTA returned ${res.status}`);
        const d = await res.json();
        const rows = Array.isArray(d) ? d : [];
        if (!rows.length)
            return `No stops for route ${route}.`;
        return `Stops on route ${route} (${rows.length}):\n` +
            rows.slice(0, 20).map((r, i) => {
                const s = (k) => (r[k] != null ? String(r[k]) : '');
                return `${i + 1}. ${s('stop_name')}`;
            }).join('\n');
    }
    return { next, stops };
})();
const m1 = (() => {
    const UA = "mrfentmen-transit-mcp/1.0 (https://github.com/mrfentmen)";
    class TransitError extends Error {
    }
    async function get(url) {
        const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(25000) });
        if (!res.ok)
            throw new TransitError(`SEPTA error ${res.status}`);
        return (await res.json());
    }
    async function nextArrivals(args) {
        const o = encodeURIComponent(args.origin ?? "");
        const d = encodeURIComponent(args.destination ?? "");
        const rows = await get(`https://www3.septa.org/api/NextToArrive/index.php?req1=${o}&req2=${d}&req3=10`);
        if (!rows?.length)
            return "No arrivals found";
        return `Next arrivals ${args.origin} to ${args.destination}\n${rows.map((r) => `${r.orig_train ?? "?"} | ${r.orig_departure_time ?? ""} -> ${r.dest_arrival_time ?? ""} | ${r.status ?? ""}`).join("\n")}`;
    }
    async function transitView(args) {
        const r = encodeURIComponent(args.route ?? "");
        const d = await get(`https://www3.septa.org/api/TransitView/index.php?route=${r}`);
        const buses = d.bus ?? [];
        if (!buses.length)
            return `No live vehicles for route ${args.route}`;
        return `Live vehicles on route ${args.route}\n${buses.slice(0, 25).map((b) => `${b.label ?? "bus"} | ${b.block ?? ""} | ${b.lat ?? ""}, ${b.lng ?? ""} | ${b.direction ?? ""}`).join("\n")}`;
    }
    return { TransitError, nextArrivals, transitView };
})();
export const TransitError = m1.TransitError;
export const next = m0.next;
export const nextArrivals = m1.nextArrivals;
export const stops = m0.stops;
export const transitView = m1.transitView;
export const m0_stops = m0.stops;
export const m0_next = m0.next;
export const m1_nextArrivals = m1.nextArrivals;
export const m1_TransitError = m1.TransitError;
export const m1_transitView = m1.transitView;
