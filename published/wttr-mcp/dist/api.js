const BASE = 'https://wttr.in';
export async function current(args) {
    const loc = (args.location ?? '').trim();
    if (!loc)
        return 'Provide a city name or coordinates.';
    const params = new URLSearchParams({ format: 'j1' });
    const res = await fetch(`${BASE}/${encodeURIComponent(loc)}?${params.toString()}`, {
        headers: { 'User-Agent': 'mrfentmen-wttr-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`wttr.in returned ${res.status}`);
    const d = (await res.json());
    const area = d.nearest_area?.[0];
    const cond = d.current_condition?.[0];
    if (!cond)
        return 'No weather data returned.';
    const name = area?.areaName?.[0]?.value ?? loc;
    const country = area?.country?.[0]?.value ?? '';
    return [
        `Weather for ${name}${country ? `, ${country}` : ''}:`,
        `${cond.weatherDesc?.[0]?.value ?? 'Unknown'}, ${cond.temp_C ?? '?'} C (feels ${cond.FeelsLikeC ?? '?'} C)`,
        `Humidity: ${cond.humidity ?? '?'}% | Wind: ${cond.windspeedKmph ?? '?'} km/h`,
    ].filter(Boolean).join('\n');
}
async function wttrPayload(location) {
    const loc = (location ?? '').trim();
    if (!loc)
        throw new Error('Provide a city name or coordinates.');
    const params = new URLSearchParams({ format: 'j1' });
    const res = await fetch(`${BASE}/${encodeURIComponent(loc)}?${params.toString()}`, {
        headers: { 'User-Agent': 'mrfentmen-wttr-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`wttr.in returned ${res.status}`);
    const d = (await res.json());
    const days = d.weather ?? [];
    if (!days.length)
        return { place: loc, coords: '', days: [] };
    const area = d.nearest_area?.[0];
    const name = area?.areaName?.[0]?.value ?? loc;
    const country = area?.country?.[0]?.value;
    const coords = area?.latitude && area?.longitude ? ` (${area.latitude}, ${area.longitude})` : '';
    return { place: `${name}${country ? `, ${country}` : ''}${coords}`, coords, days };
}
const wttrField = (value, fallback = '?') => value != null && String(value) !== '' ? String(value) : fallback;
export async function sunMoon(args) {
    const { place, days } = await wttrPayload(args.location);
    if (!days.length)
        return `wttr.in returned no astronomy data for "${args.location}".`;
    return `Sun and moon for ${place}:\n` +
        days.map((d) => {
            const a = d.astronomy?.[0] ?? {};
            return `  ${wttrField(d.date)}: sunrise ${wttrField(a.sunrise, 'not reported')}, sunset ${wttrField(a.sunset, 'not reported')}, moon ${wttrField(a.moon_phase, 'not reported')} ${wttrField(a.moon_illumination, '?')}% illuminated, moonrise ${wttrField(a.moonrise, 'not reported')}, moonset ${wttrField(a.moonset, 'not reported')}`;
        }).join('\n');
}
// Each one is read from the eight three-hourly blocks of a day, which is the
// only place wttr.in puts a chance: the daily record carries temperatures, sun
// hours and the UV index, and no precipitation chance at all.
const CRITERIA = {
    rain: { key: 'chanceofrain', label: 'peak chance of rain', unit: '%' },
    snow: { key: 'chanceofsnow', label: 'peak chance of snow', unit: '%' },
    thunder: { key: 'chanceofthunder', label: 'peak chance of thunder', unit: '%' },
    fog: { key: 'chanceoffog', label: 'peak chance of fog', unit: '%' },
    frost: { key: 'chanceoffrost', label: 'peak chance of frost', unit: '%' },
    wind: { key: 'windspeedKmph', label: 'strongest wind', unit: 'km/h' },
    gust: { key: 'WindGustKmph', label: 'strongest gust', unit: 'km/h' },
    temperature_swing: { key: '__swing', label: 'difference between the high and the low', unit: 'C' },
};
