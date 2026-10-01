const UA = 'mrfentmen-nextbus-mcp/1.0';
const BASE = 'https://retro.umoiq.com/service/publicJSONFeed';

interface Agency {
  tag?: string;
  title?: string;
}
interface Route {
  tag?: string;
  title?: string;
}
interface Prediction {
  minutes?: number;
  vehicle?: string;
  block?: string;
  tripTag?: string;
}
interface PredictionDir {
  title?: string;
  prediction?: Prediction[] | Prediction;
}

function toArray<T>(x: T[] | T | undefined): T[] {
  if (x == null) return [];
  return Array.isArray(x) ? x : [x];
}

export interface AgencyArg {
  agency: string;
}
export interface StopArg {
  agency: string;
  stop: string;
  route?: string;
}

export async function agencies(_args?: Record<string, never>): Promise<string> {
  const res = await fetch(`${BASE}?command=agencyList`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`NextBus returned ${res.status}`);
  const d = (await res.json()) as { agency?: Agency[] | Agency };
  const list = toArray(d.agency);
  if (!list.length) return 'No agencies returned.';
  return `NextBus agencies (${list.length}):\n` + list.slice(0, 20).map((a) => `* ${a.tag ?? '?'} - ${a.title ?? '?'}`).join('\n');
}

export async function routes(args: AgencyArg): Promise<string> {
  const res = await fetch(`${BASE}?command=routeList&a=${encodeURIComponent(args.agency)}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`NextBus returned ${res.status}`);
  const d = (await res.json()) as { route?: Route[] | Route };
  const list = toArray(d.route);
  if (!list.length) return `No routes for agency ${args.agency}.`;
  return `Routes for ${args.agency} (${list.length}):\n` + list.slice(0, 20).map((r) => `* ${r.tag ?? '?'} - ${r.title ?? '?'}`).join('\n');
}

export async function predictions(args: StopArg): Promise<string> {
  const url = `${BASE}?command=predictions&a=${encodeURIComponent(args.agency)}&stopId=${encodeURIComponent(args.stop)}${args.route ? `&routeTag=${encodeURIComponent(args.route)}` : ''}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`NextBus returned ${res.status}`);
  const d = (await res.json()) as { predictions?: Array<{ routeTag?: string; routeTitle?: string; stopTitle?: string; direction?: PredictionDir[] | PredictionDir }> };
  const preds = d.predictions ?? [];
  if (!preds.length) return `No predictions for stop ${args.stop} on ${args.agency}.`;
  const lines: string[] = [];
  for (const p of preds) {
    const dirs = toArray(p.direction);
    for (const dir of dirs) {
      const mins = toArray(dir.prediction).map((pr) => `${pr.minutes} min`).join(', ');
      lines.push(`* ${p.routeTitle ?? p.routeTag ?? '?'} to ${dir.title ?? '?'}: ${mins || 'none'}`);
    }
  }
  return `Predictions at ${preds[0]?.stopTitle ?? args.stop} (${args.agency}):\n` + lines.join('\n');
}

// ---- muxB tools:

const SCHEDULE_UA = 'mrfentmen-nextbus-mcp/1.0';

interface ScheduledStop {
  tag?: string;
  content?: string;
  epochTime?: string;
}

interface ScheduleRoute {
  tag?: string;
  title?: string;
  direction?: number | string;
  header?: { stop?: ScheduledStop[] };
  tr?: Array<{ blockID?: string; stop?: ScheduledStop[] }>;
}

async function routeSchedule(agency: string, route: string, stopId: string): Promise<ScheduleRoute> {
  const url = `https://retro.umoiq.com/service/publicJSONFeed?command=schedule&a=${encodeURIComponent(agency)}&r=${encodeURIComponent(route)}&stopId=${encodeURIComponent(stopId)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': SCHEDULE_UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(40000),
  });
  if (!res.ok) throw new Error(`NextBus returned ${res.status}`);
  const d = (await res.json()) as { route?: ScheduleRoute | ScheduleRoute[]; Error?: { content?: string } | Array<{ content?: string }> };
  if (d.Error) {
    const content = Array.isArray(d.Error) ? d.Error[0]?.content : d.Error.content;
    throw new Error(`NextBus: ${content ?? 'schedule unavailable'}`);
  }
  const first = Array.isArray(d.route) ? d.route[0] : d.route;
  if (!first) throw new Error('NextBus returned no schedule for that route.');
  return first;
}

// OneBusAway reports stop times as epoch milliseconds within the service day,
// so 27000000 is the 07:30:00 shown in the sibling "content" field.
const secondsOf = (s?: string): number | null => {
  if (s == null) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n / 1000 : null;
};

const median = (values: number[]): number | null => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

export interface RouteTimetableArgs {
  agency: string;
  route: string;
  stopId?: string;
  maxStops?: number;
}

export interface RouteFrequencyArgs {
  agency: string;
  route: string;
  stopId?: string;
  maxStops?: number
}

export async function routeFrequency(args: RouteFrequencyArgs): Promise<string> {
  const agency = (args.agency ?? '').trim();
  const route = (args.route ?? '').trim();
  if (!agency || !route) return 'Provide both an agency and a route tag.';
  const stopId = (args.stopId ?? '0').trim() || '0';
  const maxStops = Math.max(1, Math.min(Number(args.maxStops ?? 20) || 20, 60));
  const r = await routeSchedule(agency, route, stopId);
  const stops = (r.header?.stop ?? []).filter((s) => s.tag != null);
  if (!stops.length) return `The schedule for ${agency} route ${route} lists no stops.`;
  const trips = (r.tr ?? []).filter((t) => Array.isArray(t.stop) && t.stop.length > 0);
  const byTag = new Map<string, number[]>();
  for (const trip of trips) {
    for (const s of trip.stop ?? []) {
      const sec = secondsOf(s.epochTime);
      if (sec == null || s.tag == null) continue;
      const list = byTag.get(s.tag) ?? [];
      list.push(sec);
      byTag.set(s.tag, list);
    }
  }
  const lines = [
    `Service frequency for ${agency} route ${r.tag ?? route}${r.title ? ` (${r.title})` : ''}:`,
    `Headways are the gaps between consecutive published departures, ignoring gaps over 2 hours.`,
  ];
  let shown = 0;
  let counted = 0;
  for (const stop of stops) {
    if (shown >= maxStops) {
      lines.push(`... and ${stops.length - shown} more stop(s).`);
      break;
    }
    const times = (byTag.get(String(stop.tag)) ?? []).sort((a, b) => a - b);
    if (times.length < 2) {
      lines.push(`* ${String(stop.tag)} ${stop.content ?? '(unnamed)'} - ${times.length} departure(s) in the week, not enough for a headway`);
      shown += 1;
      continue;
    }
    const gaps: number[] = [];
    for (let i = 1; i < times.length; i += 1) {
      const delta = times[i] - times[i - 1];
      if (delta > 0 && delta <= 7200) gaps.push(delta);
    }
    const med = median(gaps);
    const busiest = gaps.length ? Math.min(...gaps) : null;
    const quietest = gaps.length ? Math.max(...gaps) : null;
    counted += 1;
    lines.push(
      `* ${String(stop.tag)} ${stop.content ?? '(unnamed)'} - ${times.length} departures, ${gaps.length} headways` +
        (med != null ? `, median ${Math.max(1, Math.round(med / 60))} min` : '') +
        (busiest != null ? `, tightest ${Math.max(1, Math.round(busiest / 60))} min` : '') +
        (quietest != null ? `, longest daytime gap ${Math.round(quietest / 60)} min` : '')
    );
    shown += 1;
  }
  if (!counted) lines.push('No stop had two or more published departures, so no headway could be computed.');
  return lines.join('\n');
}
