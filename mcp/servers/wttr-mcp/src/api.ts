const BASE = 'https://wttr.in';

export interface CurrentArgs {
  location: string;
}

export async function current(args: CurrentArgs): Promise<string> {
  const loc = (args.location ?? '').trim();
  if (!loc) return 'Provide a city name or coordinates.';
  const params = new URLSearchParams({ format: 'j1' });
  const res = await fetch(`${BASE}/${encodeURIComponent(loc)}?${params.toString()}`, {
    headers: { 'User-Agent': 'mrfentmen-wttr-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`wttr.in returned ${res.status}`);
  const d = (await res.json()) as {
    nearest_area?: Array<{ areaName?: Array<{ value?: string }>; country?: Array<{ value?: string }> }>;
    current_condition?: Array<{ temp_C?: string; weatherDesc?: Array<{ value?: string }>; humidity?: string; windspeedKmph?: string; FeelsLikeC?: string }>;
  };
  const area = d.nearest_area?.[0];
  const cond = d.current_condition?.[0];
  if (!cond) return 'No weather data returned.';
  const name = area?.areaName?.[0]?.value ?? loc;
  const country = area?.country?.[0]?.value ?? '';
  return [
    `Weather for ${name}${country ? `, ${country}` : ''}:`,
    `${cond.weatherDesc?.[0]?.value ?? 'Unknown'}, ${cond.temp_C ?? '?'} C (feels ${cond.FeelsLikeC ?? '?'} C)`,
    `Humidity: ${cond.humidity ?? '?'}% | Wind: ${cond.windspeedKmph ?? '?'} km/h`,
  ].filter(Boolean).join('\n');
}

// ---- muxB tools:

interface WttrAstronomy {
  sunrise?: string
  sunset?: string
  moonrise?: string
  moonset?: string
  moon_phase?: string
  moon_illumination?: string
}

interface WttrHourly {
  time?: string
  tempC?: string
  FeelsLikeC?: string
  weatherDesc?: Array<{ value?: string }>
  chanceofrain?: string
  chanceofsnow?: string
  chanceofthunder?: string
  humidity?: string
  windspeedKmph?: string
  WindGustKmph?: string
  winddir16Point?: string
  pressure?: string
  uvIndex?: string
  visibility?: string
}

interface WttrDay {
  date?: string
  mintempC?: string
  maxtempC?: string
  avgtempC?: string
  sunHour?: string
  uvIndex?: string
  totalSnow_cm?: string
  astronomy?: WttrAstronomy[]
  hourly?: WttrHourly[]
}

interface WttrPayload {
  nearest_area?: Array<{ areaName?: Array<{ value?: string }>; country?: Array<{ value?: string }>; latitude?: string; longitude?: string }>
  weather?: WttrDay[]
}

async function wttrPayload(location: string): Promise<{ place: string; coords: string; days: WttrDay[] }> {
  const loc = (location ?? '').trim()
  if (!loc) throw new Error('Provide a city name or coordinates.')
  const params = new URLSearchParams({ format: 'j1' })
  const res = await fetch(`${BASE}/${encodeURIComponent(loc)}?${params.toString()}`, {
    headers: { 'User-Agent': 'mrfentmen-wttr-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`wttr.in returned ${res.status}`)
  const d = (await res.json()) as WttrPayload
  const days = d.weather ?? []
  if (!days.length) return { place: loc, coords: '', days: [] }
  const area = d.nearest_area?.[0]
  const name = area?.areaName?.[0]?.value ?? loc
  const country = area?.country?.[0]?.value
  const coords = area?.latitude && area?.longitude ? ` (${area.latitude}, ${area.longitude})` : ''
  return { place: `${name}${country ? `, ${country}` : ''}${coords}`, coords, days }
}

const wttrField = (value: unknown, fallback = '?'): string =>
  value != null && String(value) !== '' ? String(value) : fallback

export interface ForecastArgs {
  location: string;
}

export interface HourlyArgs {
  location: string;
  day?: number;
}

export interface SunMoonArgs {
  location: string;
}

export async function sunMoon(args: SunMoonArgs): Promise<string> {
  const { place, days } = await wttrPayload(args.location)
  if (!days.length) return `wttr.in returned no astronomy data for "${args.location}".`
  return `Sun and moon for ${place}:\n` +
    days.map((d) => {
      const a = d.astronomy?.[0] ?? {}
      return `  ${wttrField(d.date)}: sunrise ${wttrField(a.sunrise, 'not reported')}, sunset ${wttrField(a.sunset, 'not reported')}, moon ${wttrField(a.moon_phase, 'not reported')} ${wttrField(a.moon_illumination, '?')}% illuminated, moonrise ${wttrField(a.moonrise, 'not reported')}, moonset ${wttrField(a.moonset, 'not reported')}`
    }).join('\n')
}

// ---- gap3c tools:

// wttr.in resolves whatever you type into one specific point on the planet and
// reports that resolution in nearest_area, including the latitude, longitude and
// region. current prints the area name and country, which is enough to hide the
// problem: two places called Springfield, or a name the service guessed, both
// come back looking right. Nothing here reports where the answer actually came
// from, and nothing accepts coordinates.
//
// The second tool reads the eight three-hourly blocks wttr.in returns per day
// and ranks whole days against each other. forecast lists the days and hourly
// prints one of them; neither says which day is the best of the set or why.
//
// This block is spliced into the same module, so BASE, WttrAstronomy,
// WttrHourly, WttrDay, wttrPayload and wttrField are already in scope here and
// are not redeclared.

export interface ResolveLocationArgs {
  location?: string;
}

export interface ForecastRankingArgs {
  location?: string;
  by?: string;
}

interface Criterion {
  key: string;
  label: string;
  unit: string;
  // Higher is better when false, lower is better when true.
  lowerIsBetter?: boolean;
}

// Each one is read from the eight three-hourly blocks of a day, which is the
// only place wttr.in puts a chance: the daily record carries temperatures, sun
// hours and the UV index, and no precipitation chance at all.
const CRITERIA: Record<string, Criterion> = {
  rain: { key: 'chanceofrain', label: 'peak chance of rain', unit: '%' },
  snow: { key: 'chanceofsnow', label: 'peak chance of snow', unit: '%' },
  thunder: { key: 'chanceofthunder', label: 'peak chance of thunder', unit: '%' },
  fog: { key: 'chanceoffog', label: 'peak chance of fog', unit: '%' },
  frost: { key: 'chanceoffrost', label: 'peak chance of frost', unit: '%' },
  wind: { key: 'windspeedKmph', label: 'strongest wind', unit: 'km/h' },
  gust: { key: 'WindGustKmph', label: 'strongest gust', unit: 'km/h' },
  temperature_swing: { key: '__swing', label: 'difference between the high and the low', unit: 'C' },
};

