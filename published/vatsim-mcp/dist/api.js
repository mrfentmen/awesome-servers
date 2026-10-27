const BASE = 'https://data.vatsim.net/v3/vatsim-data.json';
async function load() {
    const res = await fetch(BASE, {
        headers: { 'User-Agent': 'mrfentmen-vatsim-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new Error(`VATSIM returned ${res.status}`);
    return (await res.json());
}
export async function pilots(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
    const d = await load();
    const rows = (d.pilots ?? []);
    if (!rows.length)
        return 'No pilots connected.';
    return `Connected pilots (${rows.length} total, ${Math.min(rows.length, limit)} shown):\n` +
        rows.slice(0, limit).map((p, i) => {
            const s = (k) => (p[k] != null ? String(p[k]) : '');
            return `${i + 1}. ${s('callsign')} | ${s('flight_plan') ? `${s('departure')}->${s('arrival')} ${s('planned_aircraft')}` : 'no flight plan'} | ${s('groundspeed')} kt`;
        }).join('\n');
}
export async function controllers(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
    const d = await load();
    const rows = (d.controllers ?? []);
    if (!rows.length)
        return 'No controllers connected.';
    return `Connected ATC (${rows.length} total, ${Math.min(rows.length, limit)} shown):\n` +
        rows.slice(0, limit).map((c, i) => {
            const s = (k) => (c[k] != null ? String(c[k]) : '');
            return `${i + 1}. ${s('callsign')} | ${s('frequency')} | ${s('name')}`;
        }).join('\n');
}
// ---- muxB tools:
const vsField = (row, key) => row[key] != null && String(row[key]).trim() ? String(row[key]) : 'not reported';
export async function serverList(_args) {
    const d = await load();
    const general = (d.general ?? {});
    const rows = (d.servers ?? []);
    const head = [
        `VATSIM network: ${vsField(general, 'connected_clients')} connected clients, ${vsField(general, 'unique_users')} unique users`,
        `Data version ${vsField(general, 'version')}, updated ${vsField(general, 'update_timestamp')}`,
    ];
    if (!rows.length)
        return [...head, 'No servers reported.'].join('\n');
    return [
        ...head,
        `Servers (${rows.length} shown):`,
        ...rows.map((s, i) => {
            const allow = s.client_connections_allowed === true ? 'accepts clients' : s.client_connections_allowed === false ? 'client connections refused' : 'client status not reported';
            return `${i + 1}. ${vsField(s, 'ident')} | ${vsField(s, 'location')} | ${vsField(s, 'hostname_or_ip')} | ${allow}`;
        }),
    ].join('\n');
}
