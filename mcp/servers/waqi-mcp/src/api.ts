const UA = 'mrfentmen-waqi-mcp/1.0';

export interface CityArgs {
  city: string;
}

export async function city(args: CityArgs): Promise<string> {
  const cityName = (args.city ?? '').trim();
  if (!cityName) return 'Provide a city like beijing.';
  const res = await fetch(`https://api.waqi.info/feed/${encodeURIComponent(cityName)}/?token=demo`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`WAQI returned ${res.status}`);
  const d = (await res.json()) as { status?: string; data?: { aqi?: number; idx?: number; city?: { name?: string }; iaqi?: Record<string, { v?: number }>; time?: { s?: string } } };
  if (d.status !== 'ok' || !d.data) throw new Error('WAQI: no data for that city');
  const data = d.data;
  const iaqi = data.iaqi ?? {};
  const get = (k: string) => (iaqi[k]?.v != null ? iaqi[k].v : '?');
  return [
    `WAQI air quality for ${data.city?.name ?? cityName} (${data.time?.s ?? '?'}):`,
    `AQI: ${data.aqi ?? '?'} (index ${data.idx ?? '?'})`,
    `PM2.5: ${get('pm25')} | PM10: ${get('pm10')} | O3: ${get('o3')} | NO2: ${get('no2')} | SO2: ${get('so2')} | CO: ${get('co')}`,
    `Temperature: ${get('t')}C | Humidity: ${get('h')}% | Wind: ${get('w')} m/s`,
  ].filter(Boolean).join('\n');
}

// ---- muxB tools:

const SEARCH = 'https://api.waqi.info/search/';
const FEED = 'https://api.waqi.info/feed/';

export interface StationSearchArgs {
  keyword?: string;
  limit?: number;
}

export interface NearestStationArgs {
  lat?: number;
  lon?: number;
}

