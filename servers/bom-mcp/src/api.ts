export class BomError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "BomError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }
const BASE = "https://api.weather.bom.gov.au"

async function authHeaders(): Promise<Record<string, string>> {
  return {}
}

function encodeGeohash(lat: number, lon: number, precision = 7): string {
  const base32 = "0123456789bcdefghjkmnpqrstuvwxyz"
  let even = true
  let latMin = -90
  let latMax = 90
  let lonMin = -180
  let lonMax = 180
  let bit = 0
  let ch = 0
  let out = ""
  while (out.length < precision) {
    if (even) {
      const mid = (lonMin + lonMax) / 2
      if (lon >= mid) { ch = ch * 2 + 1; lonMin = mid } else { ch = ch * 2; lonMax = mid }
    } else {
      const mid = (latMin + latMax) / 2
      if (lat >= mid) { ch = ch * 2 + 1; latMin = mid } else { ch = ch * 2; latMax = mid }
    }
    even = !even
    bit++
    if (bit === 5) { out += base32[ch]; bit = 0; ch = 0 }
  }
  return out
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(url: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(url, { headers: { ...UA, ...(await authHeaders()), ...(init.headers ?? {}) }, ...init })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new BomError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function getDailyForecast(lat: number, lon: number): Promise<string> {
  const gh = encodeGeohash(lat, lon);
  let url = BASE + `/v1/locations/${encodeURIComponent(String(gh))}/forecasts/daily`;
  const data = await req(url);
  return pretty(data);
}

export async function getHourlyForecast(lat: number, lon: number): Promise<string> {
  const gh = encodeGeohash(lat, lon);
  let url = BASE + `/v1/locations/${encodeURIComponent(String(gh))}/forecasts/hourly`;
  const data = await req(url);
  return pretty(data);
}

export async function getObservations(product: string, stationId: string): Promise<string> {
  let url = `http://www.bom.gov.au/fwo/${encodeURIComponent(String(product))}/${encodeURIComponent(String(product))}.${encodeURIComponent(String(stationId))}.json`;
  const data = await req(url);
  return pretty(data);
}

// ---- muxE tools:
// All three existing tools fetch from the Bureau of Meteorology and then print
// the response through a pretty() helper, which is JSON.stringify with a 12,000
// character cap. That is a faithful dump and a poor forecast: a person asking
// what the weather will do cannot read it, and a caller cannot compare two
// locations or two windows. All three new tools read the same verified
// endpoints and render the fields the dump already contains, and none of them
// changes what the existing tools return.
const BOM = 'https://api.weather.bom.gov.au';

const UA2 = { 'User-Agent': 'awesome-mcps/1.0' };

// The geohash encoder and BomError are private in this module. This pack is
// appended into it, so they are reused as they are rather than reimplemented;
// a second copy would be a second thing to keep correct.

interface BomDay {
  date?: string;
  temp_min?: number | null;
  temp_max?: number | null;
  short_text?: string | null;
  extended_text?: string | null;
  icon_descriptor?: string | null;
  rain?: { chance?: number | null; amount?: { min?: number | null; max?: number | null; lower_range?: number | null; upper_range?: number | null; units?: string } | null; chance_of_no_rain_category?: string | null } | null;
  uv?: { max_index?: number | null; category?: string | null; start_time?: string; end_time?: string } | null;
  fire_danger?: string | null;
  fire_danger_category?: { text?: string; default_colour?: string } | null;
  surf_danger?: string | null;
  astronomical?: { sunrise_time?: string; sunset_time?: string } | null;
  now?: unknown;
}

interface BomDaily {
  data?: BomDay[];
  metadata?: { response_timestamp?: string; issue_time?: string; next_issue_time?: string };
}

function coords(args: { lat?: number; lon?: number } | undefined): { lat: number; lon: number; gh: string } {
  const lat = Number(args?.lat);
  const lon = Number(args?.lon);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) throw new BomError('Provide a latitude between -90 and 90.');
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) throw new BomError('Provide a longitude between -180 and 180.');
  return { lat, lon, gh: encodeGeohash(lat, lon) };
}

async function daily(lat: number, lon: number, gh: string): Promise<BomDaily> {
  const res = await fetch(`${BOM}/v1/locations/${encodeURIComponent(gh)}/forecasts/daily`, {
    headers: { ...UA2, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  const data = (await res.json()) as BomDaily & { errors?: Array<{ title?: string }> };
  if (!res.ok) {
    const detail = data?.errors?.[0]?.title ?? `HTTP ${res.status}`;
    throw new BomError(`BOM returned ${detail} for geohash ${gh}.`);
  }
  if (!Array.isArray(data?.data) || !data.data.length) {
    throw new BomError(`BOM returned a forecast with no days for geohash ${gh}.`);
  }
  return data;
}

const n = (v: unknown): number | null => {
  const x = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(x) ? x : null;
};

const s = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);

const dayLabel = (iso: unknown): string => {
  const d = s(iso);
  return d ? d.slice(0, 10) : 'unknown date';
};

const utc = (iso: unknown): string => {
  const d = s(iso);
  if (!d) return 'not reported';
  const t = Date.parse(d);
  if (Number.isNaN(t)) return d;
  return `${new Date(t).toISOString().replace('T', ' ').slice(0, 16)}Z`;
};

const rainChance = (d: BomDay): number | null => n(d.rain?.chance);

const range = (lo: number | null, hi: number | null): string => {
  if (lo === null && hi === null) return 'not reported';
  if (lo === null) return `up to ${hi}`;
  if (hi === null) return `from ${lo}`;
  return lo === hi ? String(lo) : `${lo} to ${hi}`;
};

export interface ForecastTableArgs {
  lat: number;
  lon: number;
  limit?: number;
}

export interface ForecastHazardsArgs {
  lat: number;
  lon: number;
}

export interface ForecastWindowArgs {
  lat: number;
  lon: number;
  fromDate?: string;
  toDate?: string;
}

export function forecast_window(args: ForecastWindowArgs): Promise<string> {
  const { lat, lon, gh } = coords(args);
  const from = s(args?.fromDate)?.slice(0, 10);
  const to = s(args?.toDate)?.slice(0, 10);
  for (const [label, v] of [['fromDate', from], ['toDate', to]] as const) {
    if (v !== undefined && v !== null && !/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      return Promise.reject(new BomError(`${label} must be a date as YYYY-MM-DD. You gave "${v}".`));
    }
  }
  if (from && to && to < from) {
    return Promise.reject(new BomError(`toDate ${to} is before fromDate ${from}.`));
  }
  return daily(lat, lon, gh).then((d) => {
    const all = d.data as BomDay[];
    const days = all.filter((x) => {
      const day = dayLabel(x.date);
      if (from && day < from) return false;
      if (to && day > to) return false;
      return true;
    });
    if (!days.length) {
      return [
        `No days of the ${all.length}-day forecast fall in ${from ?? 'the start'} to ${to ?? 'the end'}.`,
        `  The forecast covers ${all.map((x) => dayLabel(x.date)).slice(0, 3).join(', ')} onwards.`,
      ].join('\n');
    }
    const highs = days.map((x) => n(x.temp_max)).filter((v): v is number => v !== null);
    const lows = days.map((x) => n(x.temp_min)).filter((v): v is number => v !== null);
    const chances = days.map((x) => rainChance(x)).filter((v): v is number => v !== null);
    const lines = [
      `Bureau of Meteorology window summary for ${lat}, ${lon}, ${from ?? 'from the first day'} to ${to ?? 'the last day'}:`,
      `  ${days.length} day${days.length === 1 ? '' : 's'} in the window, out of ${all.length} forecast.`,
    ];
    if (highs.length) lines.push(`  daytime high: ${range(Math.min(...highs), Math.max(...highs))}.`);
    if (lows.length) lines.push(`  overnight low: ${range(Math.min(...lows), Math.max(...lows))}.`);
    if (highs.length && lows.length) {
      const spread = Math.max(...highs) - Math.min(...lows);
      lines.push(`  the whole window spans ${spread} degrees, which is the number that decides what to pack.`);
    }
    if (chances.length) {
      const wet = chances.filter((c) => c >= 40).length;
      lines.push(`  rain chance ${Math.min(...chances)}% to ${Math.max(...chances)}%, with ${wet} day${wet === 1 ? '' : 's'} at 40% or above.`);
      const avg = chances.reduce((a, b) => a + b, 0) / chances.length;
      lines.push(`  mean rain chance across the window ${avg.toFixed(0)}%.`);
    }
    const wetDays = days.filter((x) => (n(x.rain?.amount?.max) ?? 0) > 0);
    if (wetDays.length) {
      const total = wetDays.reduce((a, x) => a + (n(x.rain?.amount?.max) ?? 0), 0);
      lines.push(`  ${wetDays.length} day${wetDays.length === 1 ? '' : 's'} forecast measurable rain, summing to at most ${total}mm.`);
    } else if (days.length > 1) {
      lines.push('  no day in this window forecasts measurable rain.');
    }
    const uvs = days.map((x) => n(x.uv?.max_index)).filter((v): v is number => v !== null);
    if (uvs.length) lines.push(`  UV index range ${Math.min(...uvs)} to ${Math.max(...uvs)}.`);
    const sun = days.map((x) => s(x.astronomical?.sunrise_time)).filter((v): v is string => v !== null);
    const set = days.map((x) => s(x.astronomical?.sunset_time)).filter((v): v is string => v !== null);
    if (sun.length && set.length) {
      lines.push(`  daylight runs from ${utc(sun[0])} to ${utc(set[set.length - 1])}, about ${(hoursBetween(sun[0], set[set.length - 1])).toFixed(1)} hours on the first day.`);
    }
    lines.push('');
    lines.push(`  Day by day, for the ${days.length} day(s) in this window:`);
    for (const day of days) {
      const mn = n(day.temp_min);
      const mx = n(day.temp_max);
      const rc = rainChance(day);
      lines.push(`    ${dayLabel(day.date)}  ${mn === null ? '-' : mn} to ${mx === null ? '-' : mx} degrees, rain ${rc === null ? 'not reported' : `${rc}%`}, ${s(day.short_text) ?? 'no summary'}`);
    }
    lines.push('');
    lines.push('  The existing daily forecast tool returns the whole window as JSON and gives no way to narrow it to a date range.');
    return lines.join('\n');
  });
}

function hoursBetween(a: string, b: string): number {
  const x = Date.parse(a);
  const y = Date.parse(b);
  if (Number.isNaN(x) || Number.isNaN(y)) return 0;
  return (y - x) / 3600000;
}

// ---- gap3d tools:

// Every other forecast tool on this server asks for weather at a point and gets
// a forecast back. The Bureau also publishes what a geohash *is*: the named
// place, its state, its timezone, its marine area and whether wave data exists
// there. That is what you need before trusting a forecast, and no tool reads it.

interface BomLocation {
  geohash?: string
  timezone?: string
  latitude?: number
  longitude?: number
  marine_area_id?: string | null
  tidal_point?: string | null
  has_wave?: boolean
  id?: string
  name?: string
  state?: string
}

export interface ResolveLocationArgs {
  lat?: number
  lon?: number
  geohash?: string
}

