const m0 = (() => {
    /**
     * Open Meteo client. Free weather forecasts and geocoding, no API key.
     */
    const GEO = "https://geocoding-api.open-meteo.com/v1/search";
    const FC = "https://api.open-meteo.com/v1/forecast";
    class MeteoError extends Error {
    }
    async function getJson(url) {
        const res = await fetch(url, {
            headers: { "User-Agent": "open-meteo-mcp/1.0" },
            signal: AbortSignal.timeout(15000),
        });
        if (!res.ok)
            throw new MeteoError(`Open Meteo error ${res.status}`);
        return res.json();
    }
    async function geocode(place, count = 5) {
        const d = await getJson(`${GEO}?name=${encodeURIComponent(place)}&count=${count}`);
        return d?.results ?? [];
    }
    async function getForecast(latitude, longitude, days = 5) {
        const url = `${FC}?latitude=${latitude}&longitude=${longitude}` +
            `&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode` +
            `&timezone=auto&forecast_days=${Math.min(days, 14)}`;
        return getJson(url);
    }
    const WMO = {
        0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
        45: "Fog", 48: "Rime fog", 51: "Light drizzle", 53: "Drizzle", 55: "Dense drizzle",
        56: "Freezing drizzle", 57: "Dense freezing drizzle", 61: "Slight rain", 63: "Rain",
        65: "Heavy rain", 66: "Freezing rain", 67: "Heavy freezing rain", 71: "Slight snow",
        73: "Snow", 75: "Heavy snow", 77: "Snow grains", 80: "Slight showers", 81: "Showers",
        82: "Violent showers", 85: "Snow showers", 86: "Heavy snow showers",
        95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Heavy thunderstorm with hail",
    };
    function weatherName(code) {
        if (code == null)
            return "Unknown";
        return WMO[code] ?? `Code ${code}`;
    }
    function formatPlace(p) {
        const lines = [
            `${p.name ?? "?"}${p.admin1 ? `, ${p.admin1}` : ""}${p.country ? `, ${p.country}` : ""}`,
            `Coords: ${p.latitude}, ${p.longitude}`,
            p.timezone ? `Timezone: ${p.timezone}` : "",
            p.population != null ? `Population: ${p.population.toLocaleString()}` : "",
        ].filter(Boolean);
        return lines.join("\n");
    }
    function formatForecast(f, placeName) {
        const c = f.current;
        const lines = [
            `Weather for ${placeName}${f.timezone ? ` (${f.timezone})` : ""}`,
            c
                ? `Now: ${weatherName(c.weathercode)}, ${c.temperature ?? "?"} C, wind ${c.windspeed ?? "?"} km/h${c.is_day === 0 ? ", night" : ""}`
                : "",
            `Updated: ${c?.time ?? "?"}`,
        ].filter(Boolean);
        const d = f.daily;
        if (d?.time) {
            lines.push("", "m0_Forecast:");
            for (let i = 0; i < d.time.length; i++) {
                const max = d.temperature_2m_max?.[i];
                const min = d.temperature_2m_min?.[i];
                const pop = d.precipitation_probability_max?.[i];
                lines.push(`- ${d.time[i]}: ${weatherName(d.weathercode?.[i])}, ${min ?? "?"} to ${max ?? "?"} C` +
                    `${pop != null ? `, rain chance ${pop}%` : ""}`);
            }
        }
        return lines.join("\n");
    }
    return { MeteoError, formatForecast, formatPlace, geocode, getForecast, weatherName };
})();
const m1 = (() => {
    const BASE = "https://api.open-meteo.com/v1/elevation";
    const UA = "mrfentmen-elevation-mcp/1.0 (https://github.com/mrfentmen)";
    class ElevationError extends Error {
    }
    async function elevation(args) {
        const lat = args.lat;
        const lon = args.lon;
        if (lat === undefined || lon === undefined || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            throw new ElevationError("Provide valid latitude and longitude");
        }
        const res = await fetch(`${BASE}?latitude=${lat}&longitude=${lon}`, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
        if (res.status === 429)
            throw new ElevationError("Open-Meteo rate limit hit, wait and retry");
        if (!res.ok)
            throw new ElevationError(`Open-Meteo error ${res.status}`);
        const d = (await res.json());
        const el = d?.elevation?.[0];
        if (el === undefined)
            throw new ElevationError("No elevation returned");
        return `Elevation at ${lat}, ${lon}: ${el} meters (${(el * 3.28084).toFixed(0)} feet)`;
    }
    return { ElevationError, elevation };
})();
const m2 = (() => {
    const BASE = "https://api.open-meteo.com/v1/forecast";
    const UA = "mrfentmen-uv-index-mcp/1.0 (https://github.com/mrfentmen)";
    class UvError extends Error {
    }
    async function get(url) {
        const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) });
        if (res.status === 429)
            throw new UvError("Open-Meteo rate limit hit, wait and retry");
        if (!res.ok)
            throw new UvError(`Open-Meteo error ${res.status}`);
        return (await res.json());
    }
    function label(uv) {
        if (uv < 3)
            return "Low";
        if (uv < 6)
            return "Moderate";
        if (uv < 8)
            return "High";
        if (uv < 11)
            return "Very high";
        return "Extreme";
    }
    async function uvForecast(args) {
        const lat = args.lat;
        const lon = args.lon;
        if (lat === undefined || lon === undefined || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            throw new UvError("Provide valid latitude and longitude");
        }
        const days = Math.min(Math.max(args.days ?? 3, 1), 16);
        const d = await get(`${BASE}?latitude=${lat}&longitude=${lon}&daily=uv_index_max&timezone=auto&forecast_days=${days}`);
        const dates = d?.daily?.time ?? [];
        const uvs = d?.daily?.uv_index_max ?? [];
        if (!dates.length)
            return "No UV data returned";
        return dates.map((date, i) => `${date}: UV ${uvs[i]} (${label(uvs[i])})`).join("\n");
    }
    return { UvError, uvForecast };
})();
export const ElevationError = m1.ElevationError;
export const MeteoError = m0.MeteoError;
export const UvError = m2.UvError;
export const elevation = m1.elevation;
export const formatForecast = m0.formatForecast;
export const formatPlace = m0.formatPlace;
export const geocode = m0.geocode;
export const getForecast = m0.getForecast;
export const uvForecast = m2.uvForecast;
export const weatherName = m0.weatherName;
export const m0_MeteoError = m0.MeteoError;
export const m0_formatForecast = m0.formatForecast;
export const m0_geocode = m0.geocode;
export const m0_getForecast = m0.getForecast;
export const m0_weatherName = m0.weatherName;
export const m0_formatPlace = m0.formatPlace;
export const m1_ElevationError = m1.ElevationError;
export const m1_elevation = m1.elevation;
export const m2_UvError = m2.UvError;
export const m2_uvForecast = m2.uvForecast;
const m3 = (() => {
    const UA3 = "mrfentmen-open-meteo-mcp/1.0 (https://github.com/mrfentmen)";
    class AirError extends Error {
    }
    async function getJson(url) {
        const res = await fetch(url, {
            headers: { "User-Agent": UA3, Accept: "application/json" },
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok)
            throw new AirError(`Open-Meteo error ${res.status}`);
        return res.json();
    }
    async function airQuality(args) {
        const lat = args.lat, lon = args.lon;
        if (lat === undefined || lon === undefined)
            throw new AirError("Provide lat and lon");
        const d = await getJson(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10,ozone`);
        const c = d?.current ?? {};
        return `Air quality at ${lat},${lon} (${String(c.time ?? "").slice(0, 16)}): US AQI ${c.us_aqi ?? "?"} | PM2.5 ${c.pm2_5 ?? "?"} | PM10 ${c.pm10 ?? "?"} | O3 ${c.ozone ?? "?"}`;
    }
    async function marine(args) {
        const lat = args.lat, lon = args.lon;
        if (lat === undefined || lon === undefined)
            throw new AirError("Provide lat and lon");
        const d = await getJson(`https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height,wave_direction,sea_surface_temperature`);
        const c = d?.current ?? {};
        return `Marine at ${lat},${lon}: waves ${c.wave_height ?? "?"} m from ${c.wave_direction ?? "?"}° | SST ${c.sea_surface_temperature ?? "?"} C`;
    }
    async function flood(args) {
        const lat = args.lat, lon = args.lon;
        if (lat === undefined || lon === undefined)
            throw new AirError("Provide lat and lon");
        const d = await getJson(`https://flood-api.open-meteo.com/v1/flood?latitude=${lat}&longitude=${lon}&past_days=7&forecast_days=7&daily=river_discharge`);
        const daily = d?.daily ?? {};
        const times = daily.time ?? [];
        const vals = daily.river_discharge ?? [];
        if (!times.length)
            return "No river discharge data (location may not be near a modeled river).";
        return `River discharge near ${lat},${lon} (m3/s):\n` + times.slice(-7).map((t, i) => `${t}: ${vals[times.length - 7 + i] ?? "n/a"}`).join("\n");
    }
    async function hourly(args) {
        const lat = args.lat, lon = args.lon;
        if (lat === undefined || lon === undefined)
            throw new AirError("Provide lat and lon");
        const n = Math.min(Math.max(Number(args.hours ?? 12) || 12, 1), 48);
        const d = await getJson(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation_probability,weathercode&timezone=auto&forecast_days=2`);
        const h = d?.hourly ?? {};
        const times = h.time ?? [];
        const temps = h.temperature_2m ?? [];
        const pops = h.precipitation_probability ?? [];
        if (!times.length)
            return "No hourly data.";
        return times.slice(0, n).map((t, i) => `${t.slice(5, 16)}: ${temps[i] ?? "?"}C rain ${pops[i] ?? "?"}%`).join("\n");
    }
    return { AirError, airQuality, marine, flood, hourly };
})();
export const AirError = m3.AirError;
export const airQuality = m3.airQuality;
export const marine = m3.marine;
export const flood = m3.flood;
export const hourly = m3.hourly;
export const m3_AirError = m3.AirError;
export const m3_airQuality = m3.airQuality;
export const m3_marine = m3.marine;
export const m3_flood = m3.flood;
export const m3_hourly = m3.hourly;
