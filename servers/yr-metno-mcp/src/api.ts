
export interface m0_PointArgs {
  lat: number;
  lon: number;
}

interface m0_TimeseriesPoint {
  time?: string;
  data?: {
    instant?: { details?: { air_temperature?: number; wind_speed?: number; wind_from_direction?: number; cloud_area_fraction?: number; relative_humidity?: number; pressure_at_sea_level?: number } };
    next_1_hours?: { summary?: { symbol_code?: string }; details?: { precipitation_amount?: number } };
  };
}

export interface m1_ForecastArgs {
  lat: number;
  lon: number;
}

interface m1_ForecastTime {
  time?: string;
  data?: {
    instant?: { details?: Record<string, number> };
    next_1_hours?: { details?: Record<string, number> };
  };
}

const m0 = (() => {
const UA = 'mrfentmen-yr-metno-mcp/1.0 (contact: github.com/mrfentmen)';



async function getCompact(lat: number, lon: number): Promise<{ units?: Record<string, string>; timeseries?: m0_TimeseriesPoint[] }> {
  const res = await fetch(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`api.met.no returned ${res.status}`);
  const j = (await res.json()) as { properties?: { meta?: { units?: Record<string, string> }; timeseries?: m0_TimeseriesPoint[] } };
  return { units: j.properties?.meta?.units, timeseries: j.properties?.timeseries };
}

async function forecast(args: m0_PointArgs): Promise<string> {
  const lat = Number(args.lat), lon = Number(args.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error('Provide valid lat and lon.');
  const d = await getCompact(lat, lon);
  const ts = d.timeseries ?? [];
  if (!ts.length) return `No forecast for ${lat},${lon}.`;
  const now = ts[0];
  const det = now.data?.instant?.details;
  const lines = ts.slice(0, 6).map((t) => {
    const dt = t.data?.instant?.details;
    const next = t.data?.next_1_hours;
    return `${String(t.time ?? '?').slice(0, 16)}: ${dt?.air_temperature != null ? `${dt.air_temperature} °C` : '?'} wind ${dt?.wind_speed ?? '?'} m/s cloud ${dt?.cloud_area_fraction ?? '?'}% ${next ? `precip ${next.details?.precipitation_amount ?? 0} mm (${next.summary?.symbol_code ?? ''})` : ''}`;
  });
  return `yr.no forecast for ${lat.toFixed(2)},${lon.toFixed(2)} (units: ${Object.entries(d.units ?? {}).slice(0, 5).map(([k, v]) => `${k}=${v}`).join(', ')}):\nNow: ${det?.air_temperature != null ? `${det.air_temperature} °C` : '?'}, wind ${det?.wind_speed ?? '?'} m/s\n` + lines.join('\n');
}

async function nowcast(args: m0_PointArgs): Promise<string> {
  const lat = Number(args.lat), lon = Number(args.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error('Provide valid lat and lon.');
  const res = await fetch(`https://api.met.no/weatherapi/nowcast/2.0/complete?lat=${lat}&lon=${lon}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`api.met.no returned ${res.status}`);
  const d = (await res.json()) as { timeseries?: Array<{ time?: string; data?: { instant?: { details?: { air_temperature?: number; wind_speed?: number; precipitation_rate?: number } } } }> };
  const ts = d.timeseries ?? [];
  if (!ts.length) return `No nowcast for ${lat},${lon}.`;
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



async function forecast(args: m1_ForecastArgs): Promise<string> {
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
  if (!res.ok) throw new Error(`Met.no returned ${res.status}`);
  const data = (await res.json()) as { properties?: { timeseries?: m1_ForecastTime[] } };
  const series = (data.properties?.timeseries ?? []).slice(0, 12);
  if (!series.length) throw new Error('Met.no returned no forecast');
  return `Weather forecast for ${args.lat}, ${args.lon} (next ${series.length} periods):\n` +
    series
      .map((t, i) => {
        const d = t.data?.instant?.details ?? {};
        const next = t.data?.next_1_hours?.details ?? {};
        const temp = d.air_temperature;
        const parts = [`${(t.time ?? '').replace('T', ' ').slice(5, 16)}`];
        if (typeof temp === 'number') parts.push(`${temp.toFixed(1)}C`);
        if (typeof next.precipitation_amount === 'number') parts.push(`rain ${next.precipitation_amount.toFixed(1)}mm`);
        if (typeof d.wind_speed === 'number') parts.push(`wind ${d.wind_speed.toFixed(1)}m/s`);
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

const METNO_UA = "mrfentmen-yr-metno-mcp/1.0 (https://github.com/mrfentmen)"
const METNO_SUN = "https://api.met.no/weatherapi/sunrise/3.0/sun"

class MetNoSunError extends Error {}

function metNoPoint(args: { lat?: number; lon?: number }): { lat: number; lon: number } {
  const lat = Number(args.lat)
  const lon = Number(args.lon)
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) throw new MetNoSunError("Provide lat between -90 and 90")
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) throw new MetNoSunError("Provide lon between -180 and 180")
  return { lat, lon }
}

/**
 * MET Norway's sun product reports sunrise and sunset with their azimuths, plus
 * solar noon and solar midnight with the sun's elevation, for a point and date.
 * The forecast and nowcast feeds carry none of that.
 */
export async function sunTimes(args: { lat?: number; lon?: number; date?: string; offset?: string }): Promise<string> {
  const { lat, lon } = metNoPoint(args)
  const date = (args.date ?? "").trim() || new Date().toISOString().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new MetNoSunError("Provide the date as YYYY-MM-DD")
  // The API needs a UTC offset for the local times it reports.
  const offset = (args.offset ?? "+00:00").trim()
  if (!/^[+-]\d{2}:\d{2}$/.test(offset)) throw new MetNoSunError("Provide the UTC offset as +HH:MM, e.g. +02:00")
  const url = `${METNO_SUN}?lat=${lat}&lon=${lon}&date=${date}&offset=${encodeURIComponent(offset)}`
  const res = await fetch(url, {
    headers: { "User-Agent": METNO_UA, Accept: "application/json" },
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new MetNoSunError(`MET Norway returned ${res.status} for ${date} at ${lat},${lon}`)
  const d = (await res.json()) as {
    when?: { interval?: [string, string] }
    properties?: {
      sunrise?: { time?: string; azimuth?: number }
      sunset?: { time?: string; azimuth?: number }
      solarnoon?: { time?: string; disc_centre_elevation?: number; visible?: boolean }
      solarmidnight?: { time?: string; disc_centre_elevation?: number; visible?: boolean }
    }
  }
  const p = d.properties ?? {}
  if (!p.sunrise?.time && !p.sunset?.time) {
    throw new MetNoSunError(`MET Norway reported no sunrise or sunset for ${date} at ${lat},${lon}, which is what it does inside the polar day or night.`)
  }
  const time = (v?: string): string => (v ? v.slice(11, 16) : "does not happen on this date")
  const dayLength = (() => {
    if (!p.sunrise?.time || !p.sunset?.time) return ""
    const rise = Date.parse(p.sunrise.time)
    const set = Date.parse(p.sunset.time)
    if (!Number.isFinite(rise) || !Number.isFinite(set) || set <= rise) return ""
    const mins = Math.round((set - rise) / 60000)
    return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, "0")}m`
  })()
  return [
    `Sun at ${lat}, ${lon} for ${date} (local time ${offset}, MET Norway):`,
    `  Sunrise: ${time(p.sunrise?.time)}${p.sunrise?.azimuth != null ? ` at azimuth ${p.sunrise.azimuth} deg` : ""}`,
    `  Sunset: ${time(p.sunset?.time)}${p.sunset?.azimuth != null ? ` at azimuth ${p.sunset.azimuth} deg` : ""}`,
    dayLength ? `  Daylight: ${dayLength}` : null,
    p.solarnoon?.time
      ? `  Solar noon: ${time(p.solarnoon.time)} | sun ${p.solarnoon.disc_centre_elevation != null ? `${p.solarnoon.disc_centre_elevation} deg above the horizon` : "elevation not reported"}${p.solarnoon.visible === true ? " | sun visible" : p.solarnoon.visible === false ? " | sun hidden by the horizon" : ""}`
      : null,
    p.solarmidnight?.time
      ? `  Solar midnight: ${time(p.solarmidnight.time)} | sun ${p.solarmidnight.disc_centre_elevation != null ? `${p.solarmidnight.disc_centre_elevation} deg above the horizon` : "elevation not reported"}${p.solarmidnight.visible === true ? " | sun visible" : p.solarmidnight.visible === false ? " | sun hidden by the horizon" : ""}`
      : null,
  ]
    .filter(Boolean)
    .join("\n")
}
