const UA = 'mrfentmen-luchtmeetnet-mcp/1.0';

export interface StationsArgs {
  limit?: number;
}

export async function stations(args: StationsArgs): Promise<string> {
  const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 50);
  const res = await fetch('https://api.luchtmeetnet.nl/open_api/stations', {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Luchtmeetnet returned ${res.status}`);
  const d = (await res.json()) as { data?: Array<{ number?: string; name?: string; lat?: number; lon?: number; station_type?: string }> };
  const list = d.data ?? [];
  if (!list.length) return 'No stations returned.';
  return `Luchtmeetnet stations (${list.length}, showing ${Math.min(limit, list.length)}):\n` +
    list.slice(0, limit).map((x, i) => `${i + 1}. ${x.name ?? '?'} (#${x.number ?? '?'}) [${x.station_type ?? '?'}] (${x.lat ?? '?'}, ${x.lon ?? '?'})`).join('\n');
}

// ---- muxC tools:

interface LmnStation {
  number?: string
  name?: string
  lat?: number
  lon?: number
  station_type?: string
  location?: string
}

interface LmnMeasurement {
  station_number?: string
  value?: number
  timestamp_measured?: string
  timestamp_measured_start?: string
  formula?: string
}

const LMN_BASE = "https://api.luchtmeetnet.nl/open_api"

class LmnError extends Error {}

async function lmnGet<T>(path: string): Promise<{ data?: T[] }> {
  const res = await fetch(`${LMN_BASE}${path}`, {
    headers: { "User-Agent": "mrfentmen-luchtmeetnet-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new LmnError(`Luchtmeetnet returned ${res.status}`)
  return (await res.json()) as { data?: T[] }
}

// The feed reports 18 formulas and the units differ between them, so the value
// is passed through untouched and only the pollutant is named.
const FORMULA_NAMES: Record<string, string> = {
  PM25: "fine particles PM2.5",
  PM10: "coarse particles PM10",
  PS: "particulate matter (soot, older PM4 measure)",
  BCWB: "black carbon, with the Dutch WB correction",
  NO2: "nitrogen dioxide",
  NO: "nitric oxide",
  NOx: "nitrogen oxides, total",
  O3: "ozone",
  CO: "carbon monoxide",
  SO2: "sulphur dioxide",
  NH3: "ammonia",
  FN: "soot (old Dutch measure)",
  C6H6: "benzene",
  C7H8: "toluene",
  C8H10: "xylene",
  C10H8: "naphthalene",
  H2S: "hydrogen sulfide",
}

