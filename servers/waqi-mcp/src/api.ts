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

export async function stationSearch(args: StationSearchArgs): Promise<string> {
  const keyword = (args.keyword ?? '').trim();
  if (!keyword) return 'Provide a place name, e.g. london.';
  const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
  const res = await fetch(`${SEARCH}?token=demo&keyword=${encodeURIComponent(keyword)}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`WAQI returned ${res.status}`);
  const d = (await res.json()) as { status?: string; data?: Array<{ uid?: number; aqi?: string; station?: { name?: string; country?: string; geo?: number[]; url?: string } }> };
  if (d.status !== 'ok') throw new Error('WAQI: station search failed');
  const rows = d.data ?? [];
  if (!rows.length) return `WAQI found no monitoring stations for "${keyword}".`;
  return `WAQI stations matching "${keyword}" (${Math.min(rows.length, limit)} of ${rows.length} shown):\n` +
    rows.slice(0, limit).map((r, i) => {
      const geo = Array.isArray(r.station?.geo) ? `${r.station.geo[0]}, ${r.station.geo[1]}` : 'coordinates not reported';
      return `${i + 1}. ${r.station?.name ?? 'not reported'}\n   ${geo} | AQI ${r.aqi && r.aqi !== '-' ? r.aqi : 'not reported'} | station uid ${r.uid ?? 'not reported'}`;
    }).join('\n');
}

export interface NearestStationArgs {
  lat?: number;
  lon?: number;
}

export async function nearestStation(args: NearestStationArgs): Promise<string> {
  const lat = Number(args.lat);
  const lon = Number(args.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return 'Provide a latitude between -90 and 90 and a longitude between -180 and 180.';
  }
  const res = await fetch(`${FEED}geo:${lat.toFixed(4)};${lon.toFixed(4)}/?token=demo`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`WAQI returned ${res.status}`);
  const d = (await res.json()) as { status?: string; data?: { aqi?: number; idx?: number; city?: { name?: string; geo?: number[]; url?: string }; time?: { s?: string; tz?: string }; dominentpol?: string; iaqi?: Record<string, { v?: number }> } };
  if (d.status !== 'ok' || !d.data) throw new Error('WAQI: no station near those coordinates');
  const data = d.data;
  const iaqi = data.iaqi ?? {};
  const get = (k: string) => (iaqi[k]?.v != null ? iaqi[k].v : 'not reported');
  const geo = Array.isArray(data.city?.geo) ? `${data.city.geo[0]}, ${data.city.geo[1]}` : 'not reported';
  return [
    `Nearest WAQI station to ${lat.toFixed(4)}, ${lon.toFixed(4)}:`,
    `Station: ${data.city?.name ?? 'not reported'}`,
    `Station coordinates: ${geo}`,
    `AQI: ${data.aqi ?? 'not reported'} (index ${data.idx ?? 'not reported'})`,
    `Main pollutant: ${data.dominentpol ?? 'not reported'}`,
    `Observed: ${data.time?.s ?? 'not reported'} ${data.time?.tz ?? ''}`.trim(),
    `PM2.5: ${get('pm25')} | PM10: ${get('pm10')} | O3: ${get('o3')} | NO2: ${get('no2')} | SO2: ${get('so2')}`,
  ].join('\n');
}
