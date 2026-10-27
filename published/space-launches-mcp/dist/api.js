const m0 = (() => {
    const BASE = "https://ll.thespacedevs.com/2.2.0";
    const UA = "mrfentmen-space-launches-mcp/1.0 (https://github.com/mrfentmen)";
    class LaunchError extends Error {
    }
    async function get(url) {
        const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(25000) });
        if (!res.ok)
            throw new LaunchError(`Launch Library error ${res.status}`);
        return (await res.json());
    }
    function fmtLaunch(l) {
        const name = l.name ?? "";
        const net = l.net ?? "";
        const status = l.status?.name ?? "unknown";
        const rocket = l.rocket?.configuration?.full_name ?? "unknown rocket";
        const pad = l.pad?.name ?? "";
        const loc = l.pad?.location?.name ?? "";
        const agency = l.launch_service_provider?.name ?? "";
        return `${net.slice(0, 16)} | ${name}\n  ${rocket} | ${status}\n  ${pad}${loc ? `, ${loc}` : ""}${agency ? ` | ${agency}` : ""}`;
    }
    async function upcomingLaunches(args) {
        const limit = Math.min(args.limit ?? 5, 15);
        const d = await get(`${BASE}/launch/upcoming/?limit=${limit}`);
        const rows = d.results ?? [];
        return rows.map(fmtLaunch).join("\n\n") || "No upcoming launches";
    }
    async function nextLaunch(_args) {
        const d = await get(`${BASE}/launch/upcoming/?limit=1`);
        const l = (d.results ?? [])[0];
        if (!l)
            throw new LaunchError("No upcoming launch found");
        return fmtLaunch(l);
    }
    return { LaunchError, nextLaunch, upcomingLaunches };
})();
const m1 = (() => {
    const BASE = 'https://ll.thespacedevs.com/2.2.0/astronaut/';
    async function list(args = {}) {
        const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
        const res = await fetch(`${BASE}?limit=${limit}`, {
            headers: { 'User-Agent': 'mrfentmen-astronauts-mcp/1.0', Accept: 'application/json' },
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok)
            throw new Error(`Launch Library returned ${res.status}`);
        const data = (await res.json());
        const rows = data.results ?? [];
        if (!rows.length)
            return 'No astronaut profiles available.';
        return `Astronauts (${data.count ?? rows.length} total, ${rows.length} shown):\n` +
            rows
                .map((a, i) => {
                const name = a.name ?? 'unknown';
                const status = a.status ? String(a.status.name ?? '') : '';
                const flights = typeof a.flights_count === 'number' ? ` | ${a.flights_count} flights` : '';
                const agency = a.agency ? ` | ${a.agency.name ?? ''}` : '';
                return `${i + 1}. ${name}${agency}${flights}${status ? ` | ${status}` : ''}`;
            })
                .join('\n');
    }
    return { list };
})();
const m2 = (() => {
    const BASE = 'https://ll.thespacedevs.com/2.2.0/launch';
    async function upcoming(args) {
        const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
        const res = await fetch(`${BASE}/upcoming/?limit=${limit}`, {
            headers: { 'User-Agent': 'mrfentmen-launchlibrary-mcp/1.0', Accept: 'application/json' },
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok)
            throw new Error(`Space Devs returned ${res.status}`);
        const d = (await res.json());
        const rows = d.results ?? [];
        if (!rows.length)
            return 'No upcoming launches.';
        return `Upcoming launches (${rows.length} shown):\n` +
            rows.map((r, i) => {
                const s = (k) => (r[k] != null ? String(r[k]) : '');
                const m = r.mission;
                const name = String(r.name ?? m?.name ?? "");
                const pad = (r.pad ?? {});
                const loc = (pad.location ?? {});
                return `${i + 1}. ${String(name ?? '')} | ${String(s('net').slice(0, 16))} | ${String(loc.name ?? pad.name ?? '')}`;
            }).join('\n');
    }
    async function previous(args) {
        const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
        const res = await fetch(`${BASE}/previous/?limit=${limit}`, {
            headers: { 'User-Agent': 'mrfentmen-launchlibrary-mcp/1.0', Accept: 'application/json' },
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok)
            throw new Error(`Space Devs returned ${res.status}`);
        const d = (await res.json());
        const rows = d.results ?? [];
        if (!rows.length)
            return 'No previous launches.';
        return `Previous launches (${rows.length} shown):\n` +
            rows.map((r, i) => {
                const s = (k) => (r[k] != null ? String(r[k]) : '');
                const m = r.mission;
                const name = String(r.name ?? m?.name ?? "");
                const status = (r.status ?? {});
                return `${i + 1}. ${String(name ?? '')} | ${String(s('net').slice(0, 16))} | ${String(status.name ?? '')}`;
            }).join('\n');
    }
    return { previous, upcoming };
})();
export const LaunchError = m0.LaunchError;
export const list = m1.list;
export const nextLaunch = m0.nextLaunch;
export const previous = m2.previous;
export const upcoming = m2.upcoming;
export const upcomingLaunches = m0.upcomingLaunches;
export const m0_upcomingLaunches = m0.upcomingLaunches;
export const m0_nextLaunch = m0.nextLaunch;
export const m0_LaunchError = m0.LaunchError;
export const m1_list = m1.list;
export const m2_previous = m2.previous;
export const m2_upcoming = m2.upcoming;
// ---- muxC tools:
const SPACEDEVS_UA = "mrfentmen-space-launches-mcp/1.0 (https://github.com/mrfentmen)";
class SpaceDevsError extends Error {
}
async function spaceDevsGet(path) {
    const res = await fetch(`https://ll.thespacedevs.com/2.2.0${path}`, {
        headers: { "User-Agent": SPACEDEVS_UA, Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (res.status === 404)
        throw new SpaceDevsError(`The SpaceDevs API has nothing at ${path}`);
    if (!res.ok)
        throw new SpaceDevsError(`The SpaceDevs API returned ${res.status}`);
    return (await res.json());
}
