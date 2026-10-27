const BASE = "https://aviationweather.gov/api/data";
const UA = "mrfentmen-aviation-weather-mcp/1.0 (https://github.com/mrfentmen)";
export class AvwxError extends Error {
}
async function get(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new AvwxError(`Aviation Weather returned HTTP ${res.status}`);
    return (await res.json());
}
function cleanStations(s) {
    return s
        .split(",")
        .map((x) => x.trim().toUpperCase())
        .filter((x) => /^[A-Z]{4}$/.test(x))
        .join(",");
}
export async function metar(args) {
    const stations = cleanStations(args.stations ?? "");
    if (!stations)
        throw new AvwxError("Provide ICAO codes like KJFK,KLAX");
    const d = await get(`${BASE}/metar?ids=${encodeURIComponent(stations)}&format=json`);
    const list = (d ?? []);
    if (!list.length)
        return `No METAR data for ${stations}`;
    return `METAR reports:\n` + list.map((m) => {
        const time = m?.obsTime ? new Date(m.obsTime).toISOString().replace("T", " ").slice(0, 16) : "";
        const wind = m?.wdir != null ? `${m.wspd ?? 0} kt from ${m.wdir} deg` : "";
        return `${m?.icaoId ?? "n/a"} ${time}\n  ${m?.rawOb ?? "no raw report"}\n  ${wind}${m?.temp ? ` | temp ${m.temp} C` : ""}${m?.dewp != null ? ` | dew ${m.dewp} C` : ""}`;
    }).join("\n");
}
export async function taf(args) {
    const stations = cleanStations(args.stations ?? "");
    if (!stations)
        throw new AvwxError("Provide ICAO codes like KJFK,KLAX");
    const d = await get(`${BASE}/taf?ids=${encodeURIComponent(stations)}&format=json`);
    const list = (d ?? []);
    if (!list.length)
        return `No TAF data for ${stations}`;
    return `TAF forecasts:\n` + list.map((t) => {
        const issued = t?.issueTime ? new Date(t.issueTime).toISOString().replace("T", " ").slice(0, 16) : "";
        return `${t?.icaoId ?? "n/a"} issued ${issued}\n  ${t?.rawTAF ?? "no raw forecast"}`;
    }).join("\n");
}
export async function airsigmetReports(_args) {
    const d = await get(`${BASE}/airsigmet?format=json`);
    const list = (d ?? []);
    if (!list.length)
        return 'Aviation Weather has no active SIGMETs.';
    // validTimeFrom and validTimeTo are epoch seconds, so scale to milliseconds
    const stamp = (seconds) => {
        const n = Number(seconds);
        return Number.isFinite(n) && n > 0 ? new Date(n * 1000).toISOString().slice(0, 16).replace('T', ' ') : 'not reported';
    };
    const kinds = new Map();
    for (const s of list) {
        const key = String(s?.airSigmetType ?? 'type not reported');
        kinds.set(key, (kinds.get(key) ?? 0) + 1);
    }
    const hazards = [...new Set(list.map((s) => s?.hazard).filter(Boolean))];
    const shown = list.slice(0, 20);
    return [
        `${list.length} active SIGMET(s) from ${new Set(list.map((s) => s?.icaoId ?? 'n/a')).size} issuing centre(s).`,
        `By type: ${[...kinds.entries()].map(([k, n]) => `${k} ${n}`).join(' | ')}`,
        hazards.length ? `Hazards covered: ${hazards.join(', ')}` : '',
        ...shown.map((s, i) => {
            const altLow = Number(s?.altitudeLow1);
            const altHigh = Number(s?.altitudeHi1);
            const band = Number.isFinite(altLow) && altLow > 0
                ? `${altLow} to ${altHigh} ft`
                : Number.isFinite(altHigh) && altHigh > 0 ? `above ${altHigh} ft` : 'altitude not reported';
            const move = Number.isFinite(Number(s?.movementSpd)) && Number(s.movementSpd) !== 0
                ? ` moving ${s.movementDir} deg at ${s.movementSpd} kt`
                : ' movement not reported';
            return `${i + 1}. ${s?.icaoId ?? 'n/a'} | ${s?.airSigmetType ?? 'type not reported'} series ${s?.seriesId ?? 'n/a'}` +
                `${s?.hazard ? ` | hazard ${s.hazard}` : ''}` +
                `${s?.severity != null ? ` | severity ${s.severity}` : ''}` +
                `\n   valid ${stamp(s?.validTimeFrom)} to ${stamp(s?.validTimeTo)} | band ${band}${move}`;
        }),
        list.length > shown.length ? `...and ${list.length - shown.length} more.` : '',
    ]
        .filter(Boolean)
        .join('\n');
}
