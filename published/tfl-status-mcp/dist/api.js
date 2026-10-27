const BASE = 'https://api.tfl.gov.uk/line/mode/tube/status';
export async function status(_args) {
    const res = await fetch(BASE, {
        headers: { 'User-Agent': 'mrfentmen-tfl-status-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`TfL returned ${res.status}`);
    const rows = (await res.json());
    if (!rows.length)
        return 'No line status returned.';
    const good = (sev) => sev === 10 || sev === 9;
    return `London tube status (${rows.length} lines):\n` +
        rows
            .map((r) => {
            const s = r.lineStatuses?.[0] ?? {};
            const sev = s.statusSeverity ?? 0;
            const desc = s.statusSeverityDescription ?? 'Unknown';
            const marker = good(sev) ? 'OK' : 'ALERT';
            return `${marker} ${r.name ?? ''}: ${desc}${s.reason && !good(sev) ? ` | ${s.reason}` : ''}`;
        })
            .join('\n');
}
// ---- muxB tools:
const MODES = ['bus', 'overground', 'trams', 'dlr', 'elizabeth-line', 'boat', 'cable-car'];
