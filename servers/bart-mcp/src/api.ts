const BASE = 'https://api.bart.gov/api';
const KEY = 'MW9S-E7SL-26DU-VV8V';

export interface EtdArgs {
  station: string;
}

export async function etd(args: EtdArgs): Promise<string> {
  const station = (args.station ?? '').trim();
  if (!station) return 'Provide a station abbreviation.';
  const res = await fetch(`${BASE}/etd.aspx?cmd=etd&orig=${encodeURIComponent(station)}&key=${KEY}&json=y`, {
    headers: { 'User-Agent': 'mrfentmen-bart-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`BART returned ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  const root = (d.root ?? {}) as Record<string, unknown>;
  const stations = (root.station ?? []) as Array<Record<string, unknown>>;
  if (!stations.length) return `No departures for ${station}.`;
  const out: string[] = [];
  for (const st of stations.slice(0, 5)) {
    const s = (k: string) => (st[k] != null ? String(st[k]) : '');
    const etds = (st.etd ?? []) as Array<Record<string, unknown>>;
    out.push(`${s('name')}:`);
    for (const e of etds.slice(0, 3)) {
      const es = (k: string) => (e[k] != null ? String(e[k]) : '');
      const ests = (e.estimate ?? []) as Array<Record<string, unknown>>;
      const mins = ests.slice(0, 3).map((m) => String(m.minutes ?? '')).join(', ');
      out.push(`  ${es('destination')} in ${mins} min`);
    }
  }
  return out.join('\n');
}

export async function stations(_args?: unknown): Promise<string> {
  const res = await fetch(`${BASE}/stn.aspx?cmd=stns&key=${KEY}&json=y`, {
    headers: { 'User-Agent': 'mrfentmen-bart-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`BART returned ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  const root = (d.root ?? {}) as Record<string, unknown>;
  const stations = (root.stations as { station?: Array<Record<string, unknown>> } | undefined)?.station ?? [];
  if (!stations.length) return 'No stations returned.';
  return `BART stations (${stations.length}):\n` +
    stations.slice(0, 30).map((st, i) => {
      const s = (k: string) => (st[k] != null ? String(st[k]) : '');
      return `${i + 1}. ${s('abbr')} | ${s('name')} | ${s('city')}`;
    }).join('\n');
}

// ---- muxP tools:

interface BartStationRecord {
  name?: string
  abbr?: string
  address?: string
  city?: string
  county?: string
  state?: string
  zipcode?: string
  gtfs_latitude?: string
  gtfs_longitude?: string
}

async function bartStations(): Promise<BartStationRecord[]> {
  const res = await fetch(`${BASE}/stn.aspx?cmd=stns&key=${KEY}&json=y`, {
    headers: { "User-Agent": "mrfentmen-bart-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`BART returned HTTP ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  const root = (d.root ?? {}) as Record<string, unknown>;
  const wrap = (root.stations as { station?: BartStationRecord[] } | undefined)?.station ?? [];
  if (!wrap.length) throw new Error("BART returned no stations.");
  return wrap;
}

const field = (value: string | undefined): string =>
  typeof value === "string" && value.trim() ? value.trim() : "not reported"

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number): number => (d * Math.PI) / 180;
  const R = 6371;
  const a =
    Math.sin(toRad(lat2 - lat1) / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad(lon2 - lon1) / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

export interface StationLocationsArgs {
  city?: string
  latitude?: number
  longitude?: number
  limit?: number
}

interface BartEstimate {
  minutes?: string
  platform?: string
  direction?: string
  length?: string
  color?: string
  bikeflag?: string
  delay?: string
  cancelflag?: string
}

interface BartTrain {
  destination?: string
  abbreviation?: string
  limited?: string
  estimate?: BartEstimate[]
}

interface BartEtdStation {
  name?: string
  abbr?: string
  etd?: BartTrain[]
}

export interface NetworkStatusArgs {
  limit?: number
}

