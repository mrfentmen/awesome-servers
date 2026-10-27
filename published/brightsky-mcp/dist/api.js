const UA = 'mrfentmen-brightsky-mcp/1.0';
export async function weather(args) {
    const lat = Number(args.lat);
    const lon = Number(args.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon))
        return 'Provide valid coordinates.';
    const date = (args?.date ?? '').trim();
    const url = date
        ? `https://api.brightsky.dev/weather?lat=${lat}&lon=${lon}&date=${encodeURIComponent(date)}`
        : `https://api.brightsky.dev/weather?lat=${lat}&lon=${lon}`;
    const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`Bright Sky returned ${res.status}`);
    const d = (await res.json());
    const w = d.weather ?? [];
    if (!w.length)
        return 'No weather data returned.';
    const rows = w.slice(0, 10).map((x, i) => `${i + 1}. ${x.timestamp ?? '?'} | ${x.temperature != null ? x.temperature + 'C' : '?'} | ${x.condition ?? '?'} | wind ${x.wind_speed ?? '?'} km/h | rain ${x.precipitation ?? '?'} mm`);
    return `Bright Sky weather (${date || 'now'}):\n${rows.join('\n')}`;
}
// ---- muxA tools:
const SKY = "https://api.brightsky.dev/weather";
function coord(args) {
    const lat = Number(args.lat);
    const lon = Number(args.lon);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90)
        throw new Error("Provide a lat between -90 and 90.");
    if (!Number.isFinite(lon) || lon < -180 || lon > 180)
        throw new Error("Provide a lon between -180 and 180.");
    return { lat, lon };
}
function today() {
    return new Date().toISOString().slice(0, 10);
}
async function sky(params) {
    const query = new URLSearchParams(params);
    const res = await fetch(`${SKY}?${query.toString()}`, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
        let detail = "";
        try {
            const body = (await res.json());
            detail = ` | ${JSON.stringify(body.detail).slice(0, 200)}`;
        }
        catch {
            detail = "";
        }
        throw new Error(`Bright Sky returned ${res.status}${detail}`);
    }
    const d = (await res.json());
    return { weather: d.weather ?? [], sources: d.sources ?? [] };
}
function num(value, digits = 1) {
    const n = Number(value);
    return Number.isFinite(n) ? n.toFixed(digits) : "?";
}
export async function weatherSources(args) {
    const { lat, lon } = coord(args);
    const { sources } = await sky({
        lat: String(lat),
        lon: String(lon),
        date: (args.date ?? "").trim() || today(),
        current: "true",
    });
    if (!sources.length)
        return "Bright Sky returned no source stations for that location.";
    return [
        `Weather stations backing the Bright Sky data for ${lat}, ${lon}: ${sources.length}.`,
        ...sources.map((s, i) => `${i + 1}. ${s.station_name ?? `source ${s.id ?? i}`} | WMO ${s.wmo_station_id ?? "?"} | national ${s.dwd_station_id ?? "?"} | ${num(s.lat, 4)}, ${num(s.lon, 4)} at ${num(s.height, 0)} m | ${s.observation_type ?? "?"} | first record ${String(s.first_record ?? "?").slice(0, 16)} | last record ${String(s.last_record ?? "?").slice(0, 16)} | timeseries ${s.timeseries ?? "?"}`),
        "Provenance matters for weather data: these are the actual stations and models that produced the forecast for your coordinate.",
    ].join("\n");
}
