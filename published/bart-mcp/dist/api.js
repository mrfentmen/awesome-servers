const BASE = 'https://api.bart.gov/api';
const KEY = 'MW9S-E7SL-26DU-VV8V';
export async function etd(args) {
    const station = (args.station ?? '').trim();
    if (!station)
        return 'Provide a station abbreviation.';
    const res = await fetch(`${BASE}/etd.aspx?cmd=etd&orig=${encodeURIComponent(station)}&key=${KEY}&json=y`, {
        headers: { 'User-Agent': 'mrfentmen-bart-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`BART returned ${res.status}`);
    const d = (await res.json());
    const root = (d.root ?? {});
    const stations = (root.station ?? []);
    if (!stations.length)
        return `No departures for ${station}.`;
    const out = [];
    for (const st of stations.slice(0, 5)) {
        const s = (k) => (st[k] != null ? String(st[k]) : '');
        const etds = (st.etd ?? []);
        out.push(`${s('name')}:`);
        for (const e of etds.slice(0, 3)) {
            const es = (k) => (e[k] != null ? String(e[k]) : '');
            const ests = (e.estimate ?? []);
            const mins = ests.slice(0, 3).map((m) => String(m.minutes ?? '')).join(', ');
            out.push(`  ${es('destination')} in ${mins} min`);
        }
    }
    return out.join('\n');
}
export async function stations(_args) {
    const res = await fetch(`${BASE}/stn.aspx?cmd=stns&key=${KEY}&json=y`, {
        headers: { 'User-Agent': 'mrfentmen-bart-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`BART returned ${res.status}`);
    const d = (await res.json());
    const root = (d.root ?? {});
    const stations = root.stations?.station ?? [];
    if (!stations.length)
        return 'No stations returned.';
    return `BART stations (${stations.length}):\n` +
        stations.slice(0, 30).map((st, i) => {
            const s = (k) => (st[k] != null ? String(st[k]) : '');
            return `${i + 1}. ${s('abbr')} | ${s('name')} | ${s('city')}`;
        }).join('\n');
}
async function bartStations() {
    const res = await fetch(`${BASE}/stn.aspx?cmd=stns&key=${KEY}&json=y`, {
        headers: { "User-Agent": "mrfentmen-bart-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`BART returned HTTP ${res.status}`);
    const d = (await res.json());
    const root = (d.root ?? {});
    const wrap = root.stations?.station ?? [];
    if (!wrap.length)
        throw new Error("BART returned no stations.");
    return wrap;
}
const field = (value) => typeof value === "string" && value.trim() ? value.trim() : "not reported";
function haversineKm(lat1, lon1, lat2, lon2) {
    const toRad = (d) => (d * Math.PI) / 180;
    const R = 6371;
    const a = Math.sin(toRad(lat2 - lat1) / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad(lon2 - lon1) / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}
