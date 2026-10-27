const BASE = 'https://www.ncei.noaa.gov/access/services/data/v1';
export async function summary(args) {
    const station = (args.station ?? '').trim().toUpperCase();
    const start = (args.start ?? '').trim();
    if (!station || !start)
        return 'Provide a station id and a start date (YYYY-MM-DD).';
    const end = (args.end ?? '').trim() || start;
    const params = new URLSearchParams({
        dataset: 'daily-summaries',
        stations: station,
        startDate: start,
        endDate: end,
        units: 'metric',
        format: 'json',
    });
    const res = await fetch(`${BASE}?${params.toString()}`, {
        headers: { 'User-Agent': 'mrfentmen-noaa-ncei-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`NOAA NCEI returned ${res.status}`);
    const data = (await res.json());
    const rows = data.slice(0, 10);
    if (!rows.length)
        return `No data for station ${station}.`;
    return `NOAA daily summaries for ${station} (${rows.length} shown):\n` +
        rows
            .map((r, i) => {
            const s = (k) => (r[k] != null ? String(r[k]) : '');
            return `${i + 1}. ${s('DATE')} | TMAX ${s('TMAX')} C | TMIN ${s('TMIN')} C${s('PRCP') ? ` | PRCP ${s('PRCP')} mm` : ''}`;
        })
            .join('\n');
}
// ---- muxB tools:
const NCEI = 'https://www.ncei.noaa.gov/access/services/data/v1';
async function nceiGet(params) {
    const qs = new URLSearchParams({ format: 'json', ...params });
    const res = await fetch(`${NCEI}?${qs.toString()}`, {
        headers: { 'User-Agent': 'mrfentmen-noaa-ncei-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
        const detail = (await res.text()).replace(/\s+/g, ' ').slice(0, 200);
        throw new Error(`NOAA NCEI returned ${res.status}: ${detail}`);
    }
    return (await res.json());
}
const nceiText = (row, key, unit = '') => {
    const v = row[key];
    if (v == null || String(v).trim() === '')
        return 'not reported';
    return `${String(v).trim()}${unit ? ` ${unit}` : ''}`;
};
