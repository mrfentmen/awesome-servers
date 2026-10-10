const BASE = 'https://disease.sh/v3/covid-19';

export interface CountryArgs {
  name: string;
}

export async function country(args: CountryArgs): Promise<string> {
  const name = (args.name ?? '').trim();
  if (!name) return 'Provide a country name or code.';
  const res = await fetch(`${BASE}/countries/${encodeURIComponent(name)}`, {
    headers: { 'User-Agent': 'mrfentmen-covid-data-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`disease.sh returned ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  if (!d.country) return `No COVID data found for "${name}".`;
  return [
    `Country: ${d.country}`,
    `Cases: ${Number(d.cases ?? 0).toLocaleString()}`,
    `Deaths: ${Number(d.deaths ?? 0).toLocaleString()}`,
    `Recovered: ${Number(d.recovered ?? 0).toLocaleString()}`,
    `Active: ${Number(d.active ?? 0).toLocaleString()}`,
    `Cases today: ${Number(d.todayCases ?? 0).toLocaleString()}`,
    `Deaths today: ${Number(d.todayDeaths ?? 0).toLocaleString()}`,
    `Tests: ${Number(d.tests ?? 0).toLocaleString()}`,
    `Population: ${Number(d.population ?? 0).toLocaleString()}`,
    `Updated: ${d.updated ? new Date(Number(d.updated)).toISOString().slice(0, 10) : 'n/a'}`,
  ].join('\n');
}

export async function global(_args: Record<string, never> = {}): Promise<string> {
  const res = await fetch(`${BASE}/all`, {
    headers: { 'User-Agent': 'mrfentmen-covid-data-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`disease.sh returned ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  return [
    `Global COVID totals:`,
    `Cases: ${Number(d.cases ?? 0).toLocaleString()}`,
    `Deaths: ${Number(d.deaths ?? 0).toLocaleString()}`,
    `Recovered: ${Number(d.recovered ?? 0).toLocaleString()}`,
    `Active: ${Number(d.active ?? 0).toLocaleString()}`,
    `Cases today: ${Number(d.todayCases ?? 0).toLocaleString()}`,
    `Deaths today: ${Number(d.todayDeaths ?? 0).toLocaleString()}`,
    `Population: ${Number(d.population ?? 0).toLocaleString()}`,
  ].join('\n');
}

// ---- muxA tools:

function num(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function fmt(value: unknown): string {
  return num(value).toLocaleString('en-US')
}

function isoDate(value: unknown): string {
  const n = num(value)
  return n > 0 ? new Date(n).toISOString().slice(0, 10) : 'not reported'
}

interface CountryRow {
  country?: string
  continent?: string
  cases?: number
  deaths?: number
  recovered?: number
  active?: number
  critical?: number
  tests?: number
  population?: number
  casesPerOneMillion?: number
  deathsPerOneMillion?: number
  oneDeathPerPeople?: number
  updated?: number
  countryInfo?: { iso2?: string; iso3?: string }
  // the ranking tool looks columns up by a name chosen at runtime
  [key: string]: unknown
}

interface ContinentRow {
  continent?: string
  cases?: number
  deaths?: number
  recovered?: number
  active?: number
  critical?: number
  tests?: number
  updated?: number
}

export interface RankArgs {
  metric?: string;
  limit?: number;
  min_population?: number;
}

export interface CompareArgs {
  countries: string;
}

export async function countryComparison(args: CompareArgs): Promise<string> {
  const raw = (args.countries ?? '').trim()
  if (!raw) return 'Provide two or more countries, comma separated, e.g. "France, Germany, Italy".'
  const names = raw.split(',').map((n) => n.trim()).filter(Boolean).slice(0, 12)
  if (names.length < 2) return 'Give at least two countries to compare.'
  const rows: Array<{ asked: string; row?: CountryRow; error?: string }> = []
  for (const name of names) {
    try {
      const res = await fetch(`${BASE}/countries/${encodeURIComponent(name)}`, {
        headers: { 'User-Agent': 'mrfentmen-covid-data-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
      })
      if (!res.ok) throw new Error(`disease.sh returned ${res.status}`)
      const d = (await res.json()) as CountryRow
      if (!d.country) throw new Error('no country row matched')
      rows.push({ asked: name, row: d })
    } catch (e) {
      rows.push({ asked: name, error: e instanceof Error ? e.message : String(e) })
    }
  }
  const good = rows.filter((r) => r.row)
  if (!good.length) return `disease.sh returned no data for any of ${names.join(', ')}.`
  const header = ['country', 'cases', 'deaths', 'deaths/million', 'cases/million', 'recovered', 'active', 'tests', 'population']
  const table = good.map((g) => [
    String(g.row?.country ?? g.asked),
    fmt(g.row?.cases),
    fmt(g.row?.deaths),
    num(g.row?.deathsPerOneMillion).toFixed(1),
    num(g.row?.casesPerOneMillion).toFixed(1),
    fmt(g.row?.recovered),
    fmt(g.row?.active),
    fmt(g.row?.tests),
    fmt(g.row?.population),
  ])
  const widths = header.map((h, i) => Math.max(h.length, ...table.map((r) => r[i].length)))
  const line = (cells: string[]) => cells.map((c, i) => c.padEnd(widths[i])).join('  ').trimEnd()
  const failed = rows.filter((r) => !r.row)
  return [
    line(header),
    line(widths.map((w) => '-'.repeat(w))),
    ...table.map(line),
    `Feed last updated ${isoDate(good[0].row?.updated)}. Cumulative totals from that snapshot, not live counts.`,
    failed.length ? `No data for: ${failed.map((f) => `${f.asked} (${f.error})`).join('; ')}` : '',
  ].filter(Boolean).join('\n')
}
