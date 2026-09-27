const BASE = 'https://stats.oecd.org/SDMX-JSON/data';
const UA = 'mrfentmen-oecd-mcp/1.0';

export interface IndicatorArgs {
  dataset?: string;
  country: string;
  series?: string;
  limit?: number;
}

interface ObsDim {
  id?: string;
  values?: Array<{ id?: string; name?: string; start?: string }>;
}

export async function indicator(args: IndicatorArgs): Promise<string> {
  const country = (args.country ?? '').trim().toUpperCase();
  if (!country) return 'Provide a country code like AUS.';
  const dataset = (args?.dataset ?? 'SNA_TABLE1').trim();
  const series = (args?.series ?? 'GDP').trim();
  const limit = Math.min(Math.max(Number(args?.limit ?? 8) || 8, 1), 20);
  // Classic OECD SDMX key shape: COUNTRY.1.0.0.0.0 (country.transaction.sector...)
  const url = `${BASE}/${dataset}/${encodeURIComponent(country)}.1.0.0.0.0?startTime=2018`;
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`OECD returned ${res.status}`);
  const d = (await res.json()) as {
    data?: {
      dataSets?: Array<{ series?: Record<string, { observations?: Record<string, Array<number | null>> }> }>;
      structures?: Array<{ dimensions?: { observation?: ObsDim[] } }>;
    };
  };
  const seriesMap = d.data?.dataSets?.[0]?.series ?? {};
  const keys = Object.keys(seriesMap);
  if (!keys.length) return `No OECD data for ${country}/${series}.`;
  // Map observation period indices to years via the time dimension values.
  const obsDims = d.data?.structures?.[0]?.dimensions?.observation ?? [];
  const timeDim = obsDims.find((od) => (od.values ?? []).some((v) => v.start)) ?? obsDims[0];
  const timeValues = timeDim?.values ?? [];
  const yearFor = (idx: number): string => {
    const t = timeValues[idx];
    if (t?.start) return String(t.start).slice(0, 4);
    if (t?.name) return t.name;
    return String(idx);
  };
  const rows: string[] = [];
  for (const k of keys.slice(0, limit)) {
    const obs = seriesMap[k]?.observations ?? {};
    const indices = Object.keys(obs).map(Number).sort((a, b) => a - b);
    const lastIdx = indices[indices.length - 1];
    if (lastIdx == null) continue;
    const val = obs[String(lastIdx)]?.[0];
    rows.push(`${yearFor(lastIdx)}: ${val != null ? val : 'n/a'}`);
  }
  if (!rows.length) return `No observations for ${country}/${series}.`;
  return `OECD ${dataset} ${series} for ${country} (latest ${rows.length} points):\n${rows.join('\n')}`;
}

const NEWAPI = 'https://sdmx.oecd.org/public/rest';
const NEWUA = 'Mozilla/5.0 (compatible; mrfentmen-oecd-mcp/1.0)';

async function newGet(path: string): Promise<any> {
  const res = await fetch(`${NEWAPI}${path}`, {
    headers: { 'User-Agent': NEWUA },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`OECD returned ${res.status}`);
  return res.json();
}

export async function nadData(args: { indicator?: string; country?: string; start?: string }): Promise<string> {
  const ind = (args.indicator ?? 'GDP').trim().toUpperCase();
  const country = (args.country ?? 'USA').trim().toUpperCase();
  const start = (args.start ?? '2020').trim();
  const d = await newGet(`/data/OECD.SDD.NAD,DSD_NAAG@DF_NAAG_I/${country}...?startPeriod=${encodeURIComponent(start)}&dimensionAtObservation=AllDimensions&format=jsondata`);
  const obs = d?.data?.observations ?? d?.observations ?? {};
  const vals = Object.entries(obs as Record<string, number[]>).slice(-8);
  if (!vals.length) return `No OECD NAD data for ${country}/${ind}.`;
  return `OECD national accounts ${country} (last ${vals.length} points):\n` + vals.map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join('\n');
}

export async function dataflows(args: { limit?: number }): Promise<string> {
  const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 30);
  const res = await fetch(`${NEWAPI}/dataflow/all?dimension_at_observation=AllDimensions`, {
    headers: { 'User-Agent': NEWUA },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`OECD returned ${res.status}`);
  const xml = await res.text();
  const ids = [...xml.matchAll(/<structure:Dataflow id="([^"]+)"/g)].map((m) => m[1]);
  const names = [...xml.matchAll(/<common:Name[^>]*>([^<]+)<\/common:Name>/g)].map((m) => m[1]);
  if (!ids.length) return 'No OECD dataflows returned.';
  return ids.slice(0, limit).map((id, i) => `${i + 1}. ${id}${names[i] ? ` — ${names[i]}` : ''}`).join('\n');
}
