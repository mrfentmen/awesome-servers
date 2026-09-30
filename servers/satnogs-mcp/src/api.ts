const UA = 'mrfentmen-satnogs-mcp/1.0';
const BASE = 'https://db.satnogs.org/api';

export interface LimitArgs {
  limit?: number;
}
export interface ModeArgs {
  mode: string;
  limit?: number;
}

export async function transmitters(args: LimitArgs): Promise<string> {
  const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 25);
  const res = await fetch(`${BASE}/transmitters/?format=json`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`SatNOGS returned ${res.status}`);
  const d = (await res.json()) as Array<{ uuid?: string; description?: string; alive?: boolean; mode?: string; uplink_low?: number | null; downlink_low?: number | null; norad_cat_id?: number | null }>;
  if (!Array.isArray(d) || !d.length) return 'No transmitters returned.';
  return `SatNOGS transmitters (${d.length} shown):\n` + d.slice(0, limit).map((t, i) => `${i + 1}. ${t.norad_cat_id ?? '?'} ${(t.description ?? '').slice(0, 60)} | ${t.mode ?? '?'} | ${t.downlink_low ?? '?'} MHz${t.alive ? '' : ' (dead)'}`).join('\n');
}

export async function byMode(args: ModeArgs): Promise<string> {
  const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 25);
  const res = await fetch(`${BASE}/transmitters/?format=json&mode=${encodeURIComponent(args.mode)}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`SatNOGS returned ${res.status}`);
  const d = (await res.json()) as Array<{ uuid?: string; description?: string; alive?: boolean; mode?: string; downlink_low?: number | null; norad_cat_id?: number | null }>;
  if (!Array.isArray(d) || !d.length) return `No transmitters with mode "${args.mode}".`;
  return `SatNOGS transmitters in mode ${args.mode} (${d.length}):\n` + d.slice(0, limit).map((t, i) => `${i + 1}. ${t.norad_cat_id ?? '?'} ${(t.description ?? '').slice(0, 60)} | ${t.downlink_low ?? '?'} MHz${t.alive ? '' : ' (dead)'}`).join('\n');
}

// ---- muxE tools:
// Both existing tools list transmitters, one of them filtered by mode, and both
// cap at 25 rows out of the 5,023 the database holds. Neither can answer the
// question a listener or an operator actually has, which is what is on a given
// satellite, what is in a given slice of spectrum, and what the whole table
// looks like. Those are three views of the same one verified endpoint, and the
// frequency fields, status, type, service and norad_cat_id were all already in
// the response and unused.
const SATNOGS = 'https://db.satnogs.org/api';

interface Tx {
  uuid?: string;
  description?: string;
  status?: string;
  alive?: boolean;
  mode?: string | null;
  mode_id?: number | null;
  type?: string | null;
  service?: string | null;
  uplink_low?: number | null;
  uplink_high?: number | null;
  downlink_low?: number | null;
  downlink_high?: number | null;
  uplink_mode?: string | null;
  norad_cat_id?: number | null;
  invert?: boolean | null;
  baud?: string | number | null;
  unconfirmed?: boolean | null;
  frequency_violation?: boolean | null;
  iaru_coordination?: boolean | null;
  updated?: string | null;
  [k: string]: unknown;
}

async function allTransmitters(): Promise<Tx[]> {
  const res = await fetch(`${SATNOGS}/transmitters/?format=json`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(40000),
  });
  if (!res.ok) throw new Error(`SatNOGS returned ${res.status}`);
  const d = (await res.json()) as Tx[];
  if (!Array.isArray(d) || !d.length) throw new Error('SatNOGS returned no transmitters.');
  return d;
}

const MHz = (hz: unknown): number | null => {
  const n = typeof hz === 'number' ? hz : typeof hz === 'string' ? Number(hz) : NaN;
  return Number.isFinite(n) && n > 0 ? n / 1e6 : null;
};

const band = (hz: unknown): string => {
  const m = MHz(hz);
  if (m === null) return 'not reported';
  if (m < 0.03) return 'LF (below 30 MHz)';
  if (m < 0.3) return 'LF (30 kHz to 300 kHz)';
  if (m < 3) return 'MF/LF low (300 kHz to 3 MHz)';
  if (m < 30) return 'HF (3 to 30 MHz)';
  if (m < 300) return 'VHF (30 to 300 MHz)';
  if (m < 1000) return 'UHF (300 MHz to 1 GHz)';
  if (m < 10000) return 'L/S band (1 to 10 GHz)';
  return 'above 10 GHz';
};

function tally(rows: Tx[], field: keyof Tx): Map<string, number> {
  const out = new Map<string, number>();
  for (const t of rows) {
    const v = t[field];
    const k = v === null || v === undefined || v === '' ? 'not reported' : String(v);
    out.set(k, (out.get(k) ?? 0) + 1);
  }
  return out;
}

const sorted = (m: Map<string, number>): Array<[string, number]> =>
  [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

const pct = (n: number, total: number): string => (total > 0 ? `${((n / total) * 100).toFixed(1)}%` : 'n/a');

export interface SatelliteTxArgs {
  noradId: number;
  limit?: number;
}

export interface FrequencyArgs {
  lowMhz: number;
  highMhz?: number;
  mode?: string;
  activeOnly?: boolean;
  limit?: number;
}

export interface SurveyArgs {
  service?: string;
  limit?: number;
}

export async function band_survey(args: SurveyArgs): Promise<string> {
  const wantService = (args?.service ?? '').trim().toLowerCase();
  const limit = Math.max(5, Math.min(40, Math.floor(Number(args?.limit ?? 15) || 15)));
  const all = await allTransmitters();
  const scope = wantService ? all.filter((t) => String(t.service ?? '').toLowerCase() === wantService) : all;
  if (!scope.length) {
    const known = [...new Set(all.map((t) => String(t.service ?? 'not reported')))].sort();
    return `No transmitter is filed under service "${args?.service}". Services in the table: ${known.join(', ')}.`;
  }
  const active = scope.filter((t) => t.status === 'active').length;
  const lines = [
    `The SatNOGS transmitter table as a whole${wantService ? `, narrowed to service ${wantService}` : ''}:`,
    `  ${scope.length} transmitters, ${active} active (${pct(active, scope.length)}) and ${scope.length - active} inactive.`,
  ];
  const byType = sorted(tally(scope, 'type'));
  lines.push(`  by type: ${byType.map(([k, v]) => `${k} (${v})`).join(', ')}.`);
  const byMode = sorted(tally(scope, 'mode'));
  lines.push(`  the ${Math.min(limit, byMode.length)} commonest modes: ${byMode.slice(0, limit).map(([k, v]) => `${k} (${v})`).join(', ')}${byMode.length > limit ? `, and ${byMode.length - limit} further mode(s)` : ''}.`);
  if (byMode.length > 20) lines.push(`  ${byMode.length} distinct modes are in use, which is a lot for anyone choosing a receiver: a wideband all-mode receiver is the only thing that covers this.`);
  const byService = sorted(tally(scope, 'service'));
  lines.push(`  by service: ${byService.map(([k, v]) => `${k} (${v})`).join(', ')}.`);
  const unknownService = byService.find(([k]) => k === 'not reported')?.[1] ?? 0;
  if (unknownService) lines.push(`  ${unknownService} of them (${pct(unknownService, scope.length)}) carry no service classification at all, so a search by service silently misses them.`);

  // The frequency distribution is the part a listener cares about and no
  // existing tool reports any of it.
  const buckets: Array<[string, (m: number) => boolean]> = [
    ['below 30 MHz (LF)', (m) => m < 30],
    ['30 to 300 MHz (VHF)', (m) => m >= 30 && m < 300],
    ['300 MHz to 1 GHz (UHF)', (m) => m >= 300 && m < 1000],
    ['1 to 10 GHz', (m) => m >= 1000 && m < 10000],
    ['10 GHz and above', (m) => m >= 10000],
  ];
  const freqs = scope.map((t) => MHz(t.downlink_low)).filter((m): m is number => m !== null);
  lines.push('');
  lines.push(`  downlink distribution across ${freqs.length} transmitters that report one:`);
  for (const [label, test] of buckets) {
    const n = freqs.filter(test).length;
    const bar = n > 0 ? '#'.repeat(Math.max(1, Math.round((n / Math.max(...buckets.map(([, t2]) => freqs.filter(t2).length))) * 40))) : '';
    lines.push(`    ${label.padEnd(24)}${String(n).padStart(6)}  ${bar}`);
  }
  if (!freqs.length) lines.push('    none of these transmitters reports a downlink frequency at all.');
  // Placeholder data is common in a crowd-sourced table and silently corrupts
  // any range query, so it is counted rather than quietly included.
  const implausible = freqs.filter((m) => m > 100000 || m < 0.001).length;
  if (implausible) {
    lines.push(`    ${implausible} of the reported frequencies are outside any real amateur or satellite band and look like placeholder entries.`);
  }
  const inverted = scope.filter((t) => t.invert === true).length;
  const violations = scope.filter((t) => t.frequency_violation === true).length;
  const coordinated = scope.filter((t) => t.iaru_coordination === true).length;
  lines.push('');
  lines.push(`  ${inverted} are flagged as inverted, ${violations} carry a frequency violation, and ${coordinated} are IARU coordinated.`);
  const ids = new Set(scope.map((t) => Number(t.norad_cat_id)).filter((n) => Number.isFinite(n) && n > 0));
  lines.push(`  these come from ${ids.size} distinct satellite catalogue ids.`);
  return lines.join('\n');
}

// ---- gap3d tools:

// The transmitter tools all read /transmitters/. The satellite catalogue is a
// different collection on the same API, and nothing on this server reaches it.

interface SatRecord {
  sat_id?: string
  norad_cat_id?: number
  norad_follow_id?: number | null
  name?: string
  names?: string
  image?: string
  status?: string
  decayed?: string | null
  launched?: string | null
  deployed?: string | null
  website?: string
  operator?: string
  countries?: string
  telemetries?: Array<{ decoder?: string }> | null
  updated?: string | null
  citation?: string
  is_frequency_violator?: boolean
  associated_satellites?: string[] | null
  reception_status?: string
  reception_evidence?: { urls?: string[] | null } | null
}

export interface SatelliteStatusArgs {
  satellite: string
  limit?: number
}

