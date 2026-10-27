const m0 = (() => {
    const UA = 'mrfentmen-yr-metno-mcp/1.0 (contact: github.com/mrfentmen)';
    async function getCompact(lat, lon) {
        const res = await fetch(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`, {
            headers: { 'User-Agent': UA, Accept: 'application/json' },
            signal: AbortSignal.timeout(25000),
        });
        if (!res.ok)
            throw new Error(`api.met.no returned ${res.status}`);
        const j = (await res.json());
        return { units: j.properties?.meta?.units, timeseries: j.properties?.timeseries };
    }
    async function forecast(args) {
        const lat = Number(args.lat), lon = Number(args.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon))
            throw new Error('Provide valid lat and lon.');
        const d = await getCompact(lat, lon);
        const ts = d.timeseries ?? [];
        if (!ts.length)
            return `No forecast for ${lat},${lon}.`;
        const now = ts[0];
        const det = now.data?.instant?.details;
        const lines = ts.slice(0, 6).map((t) => {
            const dt = t.data?.instant?.details;
            const next = t.data?.next_1_hours;
            return `${String(t.time ?? '?').slice(0, 16)}: ${dt?.air_temperature != null ? `${dt.air_temperature} °C` : '?'} wind ${dt?.wind_speed ?? '?'} m/s cloud ${dt?.cloud_area_fraction ?? '?'}% ${next ? `precip ${next.details?.precipitation_amount ?? 0} mm (${next.summary?.symbol_code ?? ''})` : ''}`;
        });
        return `yr.no forecast for ${lat.toFixed(2)},${lon.toFixed(2)} (units: ${Object.entries(d.units ?? {}).slice(0, 5).map(([k, v]) => `${k}=${v}`).join(', ')}):\nNow: ${det?.air_temperature != null ? `${det.air_temperature} °C` : '?'}, wind ${det?.wind_speed ?? '?'} m/s\n` + lines.join('\n');
    }
    async function nowcast(args) {
        const lat = Number(args.lat), lon = Number(args.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon))
            throw new Error('Provide valid lat and lon.');
        const res = await fetch(`https://api.met.no/weatherapi/nowcast/2.0/complete?lat=${lat}&lon=${lon}`, {
            headers: { 'User-Agent': UA, Accept: 'application/json' },
            signal: AbortSignal.timeout(25000),
        });
        if (!res.ok)
            throw new Error(`api.met.no returned ${res.status}`);
        const d = (await res.json());
        const ts = d.timeseries ?? [];
        if (!ts.length)
            return `No nowcast for ${lat},${lon}.`;
        const lines = ts.slice(0, 6).map((t) => {
            const dt = t.data?.instant?.details;
            return `${String(t.time ?? '?').slice(0, 16)}: ${dt?.air_temperature != null ? `${dt.air_temperature} °C` : '?'} wind ${dt?.wind_speed ?? '?'} m/s precip ${dt?.precipitation_rate ?? 0} mm/h`;
        });
        return `yr.no nowcast for ${lat.toFixed(2)},${lon.toFixed(2)}:\n` + lines.join('\n');
    }
    return { forecast, nowcast };
})();
const m1 = (() => {
    const BASE = 'https://api.met.no/weatherapi/locationforecast/2.0/compact';
    async function forecast(args) {
        if (typeof args.lat !== 'number' || typeof args.lon !== 'number') {
            return 'Provide numeric latitude and longitude.';
        }
        const url = `${BASE}?lat=${args.lat}&lon=${args.lon}`;
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'mrfentmen-met-no-mcp/1.0 (https://github.com/mrfentmen)',
                Accept: 'application/json',
            },
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok)
            throw new Error(`Met.no returned ${res.status}`);
        const data = (await res.json());
        const series = (data.properties?.timeseries ?? []).slice(0, 12);
        if (!series.length)
            throw new Error('Met.no returned no forecast');
        return `Weather forecast for ${args.lat}, ${args.lon} (next ${series.length} periods):\n` +
            series
                .map((t, i) => {
                const d = t.data?.instant?.details ?? {};
                const next = t.data?.next_1_hours?.details ?? {};
                const temp = d.air_temperature;
                const parts = [`${(t.time ?? '').replace('T', ' ').slice(5, 16)}`];
                if (typeof temp === 'number')
                    parts.push(`${temp.toFixed(1)}C`);
                if (typeof next.precipitation_amount === 'number')
                    parts.push(`rain ${next.precipitation_amount.toFixed(1)}mm`);
                if (typeof d.wind_speed === 'number')
                    parts.push(`wind ${d.wind_speed.toFixed(1)}m/s`);
                return `${i + 1}. ${parts.join(' | ')}`;
            })
                .join('\n');
    }
    return { forecast };
})();
export const forecast = m0.forecast;
export const nowcast = m0.nowcast;
export const m0_nowcast = m0.nowcast;
export const m0_forecast = m0.forecast;
export const m1_forecast = m1.forecast;
// ---- muxC tools:
const METNO_UA = "mrfentmen-yr-metno-mcp/1.0 (https://github.com/mrfentmen)";
class MetNoSunError extends Error {
}
function metNoPoint(args) {
    const lat = Number(args.lat);
    const lon = Number(args.lon);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90)
        throw new MetNoSunError("Provide lat between -90 and 90");
    if (!Number.isFinite(lon) || lon < -180 || lon > 180)
        throw new MetNoSunError("Provide lon between -180 and 180");
    return { lat, lon };
}
// ---- gap4c4 tools:
async function metExtraGet(path) {
    const res = await fetch(`https://api.met.no/weatherapi/${path}`, {
        headers: { 'User-Agent': METNO_UA, Accept: 'application/json' }, signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`MET Norway returned ${res.status}`);
    return await res.json();
}
export async function moonEvents(args) {
    const { lat, lon } = metNoPoint(args);
    const date = args.date ?? new Date().toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
        throw new Error('Use YYYY-MM-DD for date.');
    const d = await metExtraGet(`sunrise/3.0/moon?lat=${lat}&lon=${lon}&date=${date}&offset=%2B00:00`);
    const p = d.properties;
    if (!p)
        throw new Error('MET Norway did not report moon properties.');
    return [`Moon at ${lat},${lon} on ${date} (UTC)`,
        `Phase angle: ${p.moonphase ?? 'not reported'} degrees`,
        `Rise: ${p.moonrise?.time ?? 'not reported'} | azimuth ${p.moonrise?.azimuth ?? 'not reported'} degrees`,
        `Set: ${p.moonset?.time ?? 'not reported'} | azimuth ${p.moonset?.azimuth ?? 'not reported'} degrees`,
        `High moon: ${p.high_moon?.time ?? 'not reported'} | elevation ${p.high_moon?.disc_centre_elevation ?? 'not reported'} degrees`,
        `Low moon: ${p.low_moon?.time ?? 'not reported'} | elevation ${p.low_moon?.disc_centre_elevation ?? 'not reported'} degrees`].join('\n');
}
