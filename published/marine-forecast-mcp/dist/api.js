const UA = "mrfentmen-marine-forecast-mcp/1.0 (https://github.com/mrfentmen)";
const URL = "https://marine-api.open-meteo.com/v1/marine";
export class MarineError extends Error {
}
export async function forecast(args) {
    const lat = args.latitude;
    const lon = args.longitude;
    if (lat === undefined || lon === undefined)
        throw new MarineError("Provide latitude and longitude");
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180)
        throw new MarineError("Coordinates out of range");
    const days = Math.min(args.days ?? 1, 7);
    const params = new URLSearchParams({
        latitude: String(lat),
        longitude: String(lon),
        hourly: "wave_height,wave_direction,wave_period,sea_surface_temperature",
        forecast_days: String(days),
    });
    const res = await fetch(`${URL}?${params.toString()}`, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
    if (!res.ok)
        throw new MarineError(`Open Meteo returned HTTP ${res.status}`);
    const d = (await res.json());
    const h = d.hourly;
    const lines = [`Marine forecast for ${lat.toFixed(2)}, ${lon.toFixed(2)}`];
    for (let i = 0; i < Math.min(h.time.length, 24 * days); i++) {
        const wave = h.wave_height[i];
        const period = h.wave_period[i];
        const sst = h.sea_surface_temperature[i];
        if (wave === null && period === null)
            continue;
        lines.push(`${h.time[i].slice(5, 16).replace("T", " ")} | wave ${wave ?? "n/a"} m | period ${period ?? "n/a"} s | sea temp ${sst !== null ? sst.toFixed(1) + " C" : "n/a"}`);
    }
    return lines.join("\n");
}
// ---- muxB tools:
const MF_BASE = 'https://marine-api.open-meteo.com/v1/marine';
async function marineGet(params) {
    const qs = new URLSearchParams(params);
    const res = await fetch(`${MF_BASE}?${qs.toString()}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new MarineError(`Open Meteo returned HTTP ${res.status}`);
    return res.json();
}
const mfCheck = (args) => {
    const lat = Number(args.latitude);
    const lon = Number(args.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon))
        throw new MarineError('Provide latitude and longitude');
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180)
        throw new MarineError('Coordinates out of range');
    return { lat, lon };
};
const mfVal = (value, digits, unit) => {
    const n = Number(value);
    if (value === null || value === undefined || !Number.isFinite(n))
        return 'not reported';
    return `${n.toFixed(digits)}${unit ? ` ${unit}` : ''}`;
};
