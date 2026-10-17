successfully downloaded text file (SHA: b9e96c7c6b70dbff7b05c7e859bb98f045195792)
const BASE = 'https://www.7timer.info/bin/api.pl';

export interface ForecastArgs {
  lat: number;
  lon: number;
}

export async function forecast(args: ForecastArgs): Promise<string> {
  const lat = Number(args.lat);
  const lon = Number(args.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return 'Provide valid latitude and longitude.';
  const params = new URLSearchParams({ lon: String(lon), lat: String(lat), product: 'civil', output: 'json' });
  const res = await fetch(`${BASE}?${params.toString()}`, {
    headers: { 'User-Agent': 'mrfentmen-7timer-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`7Timer returned ${res.status}`);
  const raw = (await res.json()) as { dataseries?: Array<Record<string, unknown>>; init?: string };
  const rows = raw.dataseries ?? [];
  if (!rows.length) return 'No forecast data returned.';
  const icons: Record<string, string> = {
    clear: 'clear', pcloudy: 'partly cloudy', cloudy: 'cloudy', rain: 'rain', snow: 'snow', tstorm: 'thunderstorm', humid: 'humid', fog: 'fog', windy: 'windy',
  };
  return `7Timer forecast for ${lat}, ${lon} (init ${String(raw.init ?? '')}):\n` +
    rows.slice(0, 12).map((r, i) => {
      const s = (k: string) => (r[k] != null ? String(r[k]) : '');
      const icon = icons[s('icon')] ?? s('icon');
      return `+${s('timepoint')}h | ${icon} | ${s('temp2m')}C | precip ${s('prec_type')} | ${s('rh2m')}% RH`;
    }).join('\n');
}

// ---- muxF tools:
const PLACE_BASE = 'https://nominatim.openstreetmap.org';

const CONDITIONS: Record<string, string> = {
  clear: 'clear',
  pcloudy: 'partly cloudy',
  cloudy: 'cloudy',
  cloudynight: 'cloudy at night',
  cloudyday: 'cloudy by day',
  lightrain: 'light rain',
  rainday: 'rain by day',
  rainnight: 'rain at night',
  rain: 'rain',
  snow: 'snow',
  snowday: 'snow by day',
  snownight: 'snow at night',
  tstorm: 'thunderstorm',
  tstormday: 'thunderstorm by day',
  tstormnight: 'thunderstorm at night',
  humid: 'humid',
  fog: 'fog',
  windy: 'windy',
};

interface CivilRow {
  timepoint?: number;
  cloudcover?: number;
  lifted_index?: number;
  prec_type?: string;
  prec_amount?: number;
  temp2m?: number;
  rh2m?: string;
  wind10m?: { direction?: string; speed?: number };
  weather?: string;
}

interface CivilPayload {
  product?: string;
  init?: string;
  dataseries?: CivilRow[];
}

interface LightRow {
  date?: number;
  weather?: string;
  temp2m?: { max?: number; min?: number };
  wind10m_max?: number;
}

async function product(name: string, lat: number, lon: number): Promise<CivilPayload | LightRow[]> {
  const params = new URLSearchParams({ lon: String(lon), lat: String(lat), product: name, output: 'json' });
  const res = await fetch(`${BASE}?${params.toString()}`, {
    headers: { 'User-Agent': 'mrfentmen-7timer-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`7Timer returned ${res.status}`);
  return (await res.json()) as CivilPayload | LightRow[];
}

function num(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(n, max));
}

function condition(name: unknown): string {
  const key = typeof name === 'string' ? name : '';
  return CONDITIONS[key] ?? key ?? 'not reported';
}

interface NominatimPlace {
  lat?: string;
  lon?: string;
  display_name?: string;
  type?: string;
  addresstype?: string;
  country?: string;
}

/** Look a place up by name, then give the 7Timer civil forecast for the first place that matches. */
export async function forecastByPlace(args: { place?: string; limit?: number }): Promise<string> {
  const place = (args.place ?? '').trim();
  if (!place) return 'Provide a place name, for example Reykjavik or Wellington.';
  const limit = num(args.limit, 1, 5, 3);
  const url = `${PLACE_BASE}/search?${new URLSearchParams({ q: place, format: 'json', limit: String(limit) }).toString()}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'mrfentmen-7timer-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Place lookup returned ${res.status}`);
  const places = (await res.json()) as NominatimPlace[];
  if (!Array.isArray(places) || !places.length) return `No place matched "${place}".`;
  const lines = [`Place lookup for "${place}" (OpenStreetMap Nominatim), then 7Timer for the first match:`];
  places.forEach((p, i) => {
    const lat = Number(p.lat);
    const lon = Number(p.lon);
    const tag = [p.type, p.country].filter(Boolean).join(", ");
    lines.push(`${i + 1}. ${String(p.display_name ?? 'name not reported').slice(0, 160)}${tag ? ` (${tag})` : ""}`);
    lines.push(`   ${Number.isFinite(lat) ? lat.toFixed(4) : 'lat not reported'}, ${Number.isFinite(lon) ? lon.toFixed(4) : 'lon not reported'}`);
  });
  const first = places[0];
  const lat = Number(first?.lat);
  const lon = Number(first?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    lines.push('The first match had no usable coordinates, so no forecast was fetched.');
    return lines.join('\n');
  }
  const data = (await product('civil', lat, lon)) as CivilPayload;
  const rows = data.dataseries ?? [];
  lines.push(`7Timer civil series for that point, initialised ${String(data.init ?? 'not reported')}, ${rows.length} period(s):`);
  for (const r of rows.slice(0, 8)) {
    const rh = typeof r.rh2m === 'string' ? r.rh2m : r.rh2m == null ? 'not reported' : `${String(r.rh2m)}%`;
    lines.push(
      `+${String(r.timepoint ?? '?')}h | ${condition(r.weather)} | ${String(r.temp2m ?? 'n/a')}C | wind ${String(r.wind10m?.direction ?? '?')} ${String(r.wind10m?.speed ?? '?')} m/s | cloud ${String(r.cloudcover ?? '?')}/9 | RH ${rh}`,
    );
  }
  if (rows.length > 8) lines.push(`... and ${rows.length - 8} more period(s) in the series.`);
  return lines.join('\n');
}


/** Summarise the whole 7Timer civil series: coldest/warmest periods, precipitation, wind, cloud, lifted index. */
export async function forecastSummary(args: { lat: number; lon: number }): Promise<string> {
  const lat = Number(args.lat);
  const lon = Number(args.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return 'Provide valid latitude and longitude.';
  const data = (await product('civil', lat, lon)) as CivilPayload;
  const rows = data.dataseries ?? [];
  if (!rows.length) return 'No forecast data returned.';

  let coldest = rows[0], warmest = rows[0];
  let totalPrecip = 0;
  let windSum = 0, windPeak = 0;
  let cloudSum = 0, cloudMax = 0;
  let liftedMin = Infinity, liftedMax = -Infinity;

  for (const r of rows) {
    const temp = Number(r.temp2m);
    if (Number.isFinite(temp)) {
      if (temp < Number(coldest.temp2m)) coldest = r;
      if (temp > Number(warmest.temp2m)) warmest = r;
    }
    const precip = Number(r.prec_amount);
    if (Number.isFinite(precip)) totalPrecip += precip;
    const wind = Number(r.wind10m?.speed);
    if (Number.isFinite(wind)) { windSum += wind; if (wind > windPeak) windPeak = wind; }
    const cloud = Number(r.cloudcover);
    if (Number.isFinite(cloud)) { cloudSum += cloud; if (cloud > cloudMax) cloudMax = cloud; }
    const li = Number(r.lifted_index);
    if (Number.isFinite(li)) { if (li < liftedMin) liftedMin = li; if (li > liftedMax) liftedMax = li; }
  }

  const n = rows.length;
  const lines = [
    `7Timer civil-series summary for ${lat}, ${lon} (init ${String(data.init ?? 'not reported')}), ${n} period(s):`,
    `Coldest: +${String(coldest.timepoint ?? '?')}h at ${String(coldest.temp2m ?? 'n/a')}C (${condition(coldest.weather)})`,
    `Warmest: +${String(warmest.timepoint ?? '?')}h at ${String(warmest.temp2m ?? 'n/a')}C (${condition(warmest.weather)})`,
    `Temperature range: ${Number(warmest.temp2m) - Number(coldest.temp2m)}C`,
    `Total precipitation: ${totalPrecip.toFixed(1)} mm`,
    `Mean wind: ${(windSum / n).toFixed(1)} m/s | Peak wind: ${windPeak} m/s`,
    `Mean cloud: ${(cloudSum / n).toFixed(1)}/9 | Thickest cloud: ${cloudMax}/9`,
    `Lifted index: min ${liftedMin === Infinity ? 'n/a' : liftedMin}, max ${liftedMax === -Infinity ? 'n/a' : liftedMax}`,
  ];
  return lines.join('\n');
}

/** Daily outlook from the 7Timer civillight product: one row per day. */
export async function dailyOutlook(args: { lat: number; lon: number; limit?: number }): Promise<string> {
  const lat = Number(args.lat);
  const lon = Number(args.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return 'Provide valid latitude and longitude.';
  const limit = num(args.limit ?? 7, 1, 7, 7);
  const data = (await product('civillight', lat, lon)) as LightRow[];
  if (!Array.isArray(data) || !data.length) return 'No daily data returned.';

  const lines = [`7Timer daily outlook for ${lat}, ${lon}, ${Math.min(limit, data.length)} day(s):`];
  let overallMin = Infinity, overallMax = -Infinity, overallPeakWind = 0;

  for (const r of data.slice(0, limit)) {
    const date = r.date != null ? String(r.date) : 'unknown date';
    const cond = condition(r.weather);
    const lo = r.temp2m?.min;
    const hi = r.temp2m?.max;
    const wind = r.wind10m_max;
    const range = (lo != null && hi != null) ? Number(hi) - Number(lo) : null;
    if (lo != null && Number(lo) < overallMin) overallMin = Number(lo);
    if (hi != null && Number(hi) > overallMax) overallMax = Number(hi);
    if (wind != null && Number(wind) > overallPeakWind) overallPeakWind = Number(wind);
    lines.push(
      `${date} | ${cond} | low ${lo ?? 'n/a'}C high ${hi ?? 'n/a'}C${range != null ? ' (range ' + range + 'C)' : ''} | peak wind ${wind ?? 'n/a'} m/s`,
    );
  }

  lines.push(`Period extremes: low ${overallMin === Infinity ? 'n/a' : overallMin}C, high ${overallMax === -Infinity ? 'n/a' : overallMax}C, peak wind ${overallPeakWind} m/s`);
  return lines.join('\n');
}
