const UA = 'mrfentmen-bls-mcp/1.0';

export interface SeriesArgs {
  id: string;
  year?: string;
}

export interface RangeArgs {
  id: string;
  start?: string;
  end?: string;
}

async function getSingle(path: string): Promise<any> {
  const res = await fetch(`https://api.bls.gov/publicAPI/v2/timeseries/data/${path}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`BLS returned ${res.status}`);
  const d = (await res.json()) as { status?: string; Results?: { series?: Array<{ seriesID?: string; data?: Array<{ year?: string; periodName?: string; period?: string; value?: string }> }> } };
  if (d.status !== 'REQUEST_SUCCEEDED') throw new Error(`BLS: ${String(d.status ?? 'failed')}`);
  return d;
}

export async function latestValue(args: SeriesArgs): Promise<string> {
  const id = (args.id ?? '').trim().toUpperCase();
  if (!id) return 'Provide a BLS series id like LNS14000000.';
  const d = await getSingle(`${encodeURIComponent(id)}?latest=true`);
  const s = d.Results?.series?.[0];
  const row = s?.data?.[0];
  if (!row) return `No latest value for ${id}.`;
  return `Latest ${s.seriesID ?? id}: ${row.year}-${row.periodName ?? row.period}: ${row.value}`;
}

export async function seriesRange(args: RangeArgs): Promise<string> {
  const id = (args.id ?? '').trim().toUpperCase();
  if (!id) return 'Provide a BLS series id like LNS14000000.';
  const start = (args.start ?? '2020').trim();
  const end = (args.end ?? '2024').trim();
  const d = await getSingle(`${encodeURIComponent(id)}?startyear=${encodeURIComponent(start)}&endyear=${encodeURIComponent(end)}`);
  const s = d.Results?.series?.[0];
  const rows = (s?.data ?? []).slice(0, 24).map((x: { year?: string; periodName?: string; period?: string; value?: string }) => `${x.year ?? '?'}-${x.periodName ?? x.period ?? '?'}: ${x.value ?? '?'}`);
  if (!rows.length) return `No data for ${id} ${start}-${end}.`;
  return `BLS series ${s.seriesID ?? id} ${start}-${end}:\n${rows.join('\n')}`;
}

export async function popularSeries(): Promise<string> {
  const res = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/popular', {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`BLS returned ${res.status}`);
  const d = (await res.json()) as { status?: string; Results?: { series?: Array<{ seriesID?: string; survey_name?: string }> } };
  if (d.status !== 'REQUEST_SUCCEEDED') throw new Error(`BLS: ${String(d.status ?? 'failed')}`);
  const rows = (d.Results?.series ?? []).slice(0, 25).map((s) => `${s.seriesID ?? '?'} — ${s.survey_name ?? ''}`);
  return `Popular BLS series:\n${rows.join('\n')}`;
}

export async function listSurveys(): Promise<string> {
  const res = await fetch('https://api.bls.gov/publicAPI/v2/surveys', {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`BLS returned ${res.status}`);
  const d = (await res.json()) as { status?: string; Results?: { survey?: Array<{ survey_abbreviation?: string; survey_name?: string }> } };
  if (d.status !== 'REQUEST_SUCCEEDED') throw new Error(`BLS: ${String(d.status ?? 'failed')}`);
  const rows = (d.Results?.survey ?? []).map((s) => `${s.survey_abbreviation ?? '?'} — ${s.survey_name ?? ''}`);
  return `BLS surveys:\n${rows.join('\n')}`;
}
export async function series(args: SeriesArgs): Promise<string> {
  const id = (args.id ?? '').trim().toUpperCase();
  if (!id) return 'Provide a BLS series id like CES0000000001.';
  const start = (args?.year ?? '2023').trim();
  const end = String(Number(start) + 1);
  const res = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
    method: 'POST',
    headers: { 'User-Agent': UA, 'Content-Type': 'application/json' },
    body: JSON.stringify({ seriesid: [id], startyear: start, endyear: end }),
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`BLS returned ${res.status}`);
  const d = (await res.json()) as { status?: string; Results?: { series?: Array<{ seriesID?: string; data?: Array<{ year?: string; period?: string; value?: string; periodName?: string }> }> } };
  if (d.status !== 'REQUEST_SUCCEEDED') throw new Error(`BLS: ${String(d.status ?? 'failed')}`);
  const s = d.Results?.series?.[0];
  if (!s) return `No BLS series ${id}.`;
  const rows = (s.data ?? []).slice(0, 12).map((x) => `${x.year ?? '?'}-${x.periodName ?? x.period ?? '?'}: ${x.value ?? '?'}`).join('\n');
  return `BLS series ${s.seriesID ?? id}:\n${rows}`;
}
