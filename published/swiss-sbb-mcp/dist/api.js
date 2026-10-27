const BASE = 'https://transport.opendata.ch/v1';
const UA = 'mrfentmen-swiss-sbb-mcp/1.0';
export async function connections(args) {
    const from = (args.from ?? '').trim();
    const to = (args.to ?? '').trim();
    if (!from || !to)
        return 'Provide from and to stations.';
    const limit = Math.min(Math.max(Number(args.limit ?? 5) || 5, 1), 10);
    const res = await fetch(`${BASE}/connections?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&limit=${limit}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`transport.opendata.ch returned ${res.status}`);
    const d = (await res.json());
    const connections = d.connections ?? [];
    if (!connections.length)
        return `No connections from ${from} to ${to}.`;
    return `Swiss rail ${from} -> ${to} (${connections.length}):\n` +
        connections.map((c, i) => {
            const dep = c.from?.departure ? new Date(c.from.departure).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '?';
            const arr = c.to?.arrival ? new Date(c.to.arrival).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '?';
            const journey = c.sections?.find((s) => s.journey)?.journey?.name;
            return `${i + 1}. ${dep} -> ${arr} (${c.duration ?? '?'})${journey ? ` via ${journey}` : ''}`.trim();
        }).join('\n');
}
export async function stationboard(args) {
    const station = (args.station ?? '').trim();
    if (!station)
        return 'Provide a station name.';
    const limit = Math.min(Math.max(Number(args.limit ?? 10) || 10, 1), 20);
    const res = await fetch(`${BASE}/stationboard?station=${encodeURIComponent(station)}&limit=${limit}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`transport.opendata.ch returned ${res.status}`);
    const d = (await res.json());
    const journeys = d.journey ?? [];
    if (!journeys.length)
        return `No departures at ${station}.`;
    return `Departures at ${d.station?.name ?? station} (${journeys.length}):\n` +
        journeys.slice(0, limit).map((j, i) => {
            const dep = j.stop?.departure ? new Date(j.stop.departure).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '?';
            return `${i + 1}. ${dep} ${j.category ?? ''} ${j.name ?? ''} -> ${j.to ?? '?'}`.trim();
        }).join('\n');
}
// ---- muxB tools:
const SWISSTOPO = 'https://api3.geo.admin.ch/rest/services/api/SearchServer';
