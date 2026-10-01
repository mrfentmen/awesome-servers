const BASE = 'https://v6.bvg.transport.rest';
const UA = 'mrfentmen-berlin-bvg-mcp/1.0';

export interface StopsArgs {
  query: string;
  limit?: number;
}

export interface DeparturesArgs {
  id: string;
  limit?: number;
}

export async function stops(args: StopsArgs): Promise<string> {
  const query = (args.query ?? '').trim();
  if (!query) return 'Provide a stop name.';
  const limit = Math.min(Math.max(Number(args.limit ?? 10) || 10, 1), 20);
  const res = await fetch(`${BASE}/locations?query=${encodeURIComponent(query)}&results=${limit}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`transport.rest returned ${res.status}`);
  const d = (await res.json()) as Array<{ id?: string; name?: string; type?: string }>;
  if (!Array.isArray(d) || !d.length) return `No stops for "${query}".`;
  return `Berlin stops for "${query}":\n` +
    d.slice(0, limit).map((s, i) => `${i + 1}. ${s.name ?? '?'} (${s.type ?? '?'}) id=${s.id ?? '?'}`).join('\n');
}

export async function departures(args: DeparturesArgs): Promise<string> {
  const id = (args.id ?? '').trim();
  if (!id) return 'Provide a stop id.';
  const limit = Math.min(Math.max(Number(args.limit ?? 10) || 10, 1), 20);
  const res = await fetch(`${BASE}/stops/${encodeURIComponent(id)}/departures?duration=30`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`transport.rest returned ${res.status}`);
  const d = (await res.json()) as { departures?: Array<{ plannedWhen?: string; direction?: string; line?: { name?: string; mode?: string } }> };
  const departures = d.departures ?? [];
  if (!departures.length) return `No departures at ${id}.`;
  return `Departures at ${id} (next ${limit}):\n` +
    departures.slice(0, limit).map((x, i) => {
      const when = x.plannedWhen ? new Date(x.plannedWhen).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '?';
      return `${i + 1}. ${when} ${x.line?.name ?? '?'} ${x.line?.mode ?? ''} -> ${x.direction ?? '?'}`.trim();
    }).join('\n');
}

// ---- muxI tools:
/**
 * The stop board and the departures board are what this server already reads.
 * The one surface neither touches is the planner: a journey from one stop id to
 * another, with its legs, platforms, delays and interchanges.
 */
interface BjPoint {
  name?: string;
  id?: string;
  location?: { type?: string; id?: string; name?: string; latitude?: number; longitude?: number };
  point?: { type?: string; name?: string; location?: { id?: string } };
  plannedDeparture?: string;
  departureDelay?: number;
  scheduledDeparture?: string;
  prognosisType?: string;
}

interface BjTrip {
  id?: string;
  route?: { name?: string; shortName?: string; product?: string; type?: string; operator?: { name?: string }; line?: { name?: string; productName?: string } };
  direction?: string;
  plannedArrival?: string;
  arrivalDelay?: number;
  departureDelay?: number;
  plannedDeparture?: string;
  bestJourney?: boolean;
  codes?: { name?: string; type?: string }[];
}

interface BjLeg {
  origin?: BjPoint;
  destination?: BjPoint;
  departure?: string;
  plannedDeparture?: string;
  departureDelay?: number;
  arrival?: string;
  plannedArrival?: string;
  arrivalDelay?: number;
  tripId?: string;
  trip?: BjTrip | null;
  line?: { name?: string; productName?: string; productIcon?: string; operator?: { name?: string } };
  walking?: boolean;
  direction?: string;
  departurePlatform?: string;
  plannedDeparturePlatform?: string;
  arrivalPlatform?: string;
  plannedArrivalPlatform?: string;
  reachable?: boolean;
  walk?: { duration?: number; distance?: number; place?: { type?: string; name?: string } } | null;
  transfer?: {
    name?: string;
    duration?: number;
    position?: number;
    place?: { type?: string; id?: string; name?: string };
    fromPlatform?: { name?: string };
    toPlatform?: { name?: string };
  } | null;
  departurePrognosisType?: string;
  arrivalPrognosisType?: string;
  refreshToken?: string;
}

interface BjJourney {
  type?: string;
  legs?: BjLeg[];
  refreshToken?: string;
}

interface BjJourneys {
  earlierRef?: string;
  laterRef?: string;
  realtimeDataUpdatedAt?: number;
  journeys?: BjJourney[];
}

const bjDuration = (minutes: number): string => {
  if (!Number.isFinite(minutes) || minutes < 0) return 'not reported';
  const m = Math.round(minutes);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`;
};

const bjWhen = (iso: unknown): string => {
  const t = Date.parse(String(iso ?? ''));
  return Number.isFinite(t) ? new Date(t).toISOString().slice(11, 16) : 'not reported';
};

const bjDate = (iso: unknown): string => {
  const t = Date.parse(String(iso ?? ''));
  return Number.isFinite(t) ? new Date(t).toISOString().slice(0, 10) : 'not reported';
};

const bjPlace = (p: BjPoint | undefined): string => {
  const point = p?.name ?? p?.point?.name ?? p?.location?.name;
  if (point) return String(point);
  const id = p?.id ?? p?.point?.location?.id ?? p?.location?.id;
  return id ? `stop ${id}` : 'not reported';
};

/** Plan a real journey between two stop ids, with the legs, platforms, delays and interchanges. */
export async function journeyPlan(args: {
  from: string;
  to: string;
  when?: string;
  results?: number;
  transfers?: boolean;
}): Promise<string> {
  const from = (args.from ?? '').trim();
  const to = (args.to ?? '').trim();
  if (!from) return 'Provide the origin stop id, e.g. 900100003.';
  if (!to) return 'Provide the destination stop id, e.g. 900120005.';
  if (!/^[\w-]{1,32}$/.test(from) || !/^[\w-]{1,32}$/.test(to)) return 'Stop ids are the alnum ids the stops tool prints, not names.';
  const when = (args.when ?? '').trim();
  if (when && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(when)) {
    return 'Give the departure time as YYYY-MM-DDTHH:MM, or leave it out for the next departure.';
  }
  const limit = Math.min(Math.max(Number(args.results ?? 3) || 3, 1), 6);
  const stopovers = args.transfers === true;
  const qs = new URLSearchParams({
    from,
    to,
    results: String(limit),
    stopovers: stopovers ? 'true' : 'false',
    timeframes: 'departure',
  });
  if (when) qs.set('departure', when);

  const res = await fetch(`${BASE}/journeys?${qs.toString()}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`transport.rest returned ${res.status}`);
  const text = await res.text();
  if (!text.trim()) throw new Error('transport.rest returned an empty body for the journey query.');
  let d: BjJourneys;
  try {
    d = JSON.parse(text) as BjJourneys;
  } catch {
    throw new Error('transport.rest returned something that is not JSON for the journey query.');
  }
  const journeys = d.journeys ?? [];
  if (!Array.isArray(journeys) || !journeys.length) {
    return `transport.rest found no journey from ${from} to ${to}${when ? ` departing ${when.replace('T', ' ')}` : ' now'}.`;
  }

  const lines: string[] = [
    `BVG journeys from ${from} to ${to}, ${journeys.length} of ${limit} requested${stopovers ? ', interchanges included' : ''}`,
    `  realtime data updated: ${d.realtimeDataUpdatedAt ? `${bjDate(new Date(d.realtimeDataUpdatedAt * 1000).toISOString())} ${bjWhen(new Date(d.realtimeDataUpdatedAt * 1000).toISOString())} UTC` : 'not reported'}`,
    d.earlierRef ? '  an earlier departure is available from the same result' : '',
    d.laterRef ? '  a later departure is available from the same result' : '',
  ].filter(Boolean);

  journeys.slice(0, limit).forEach((j, i) => {
    const legs = (j.legs ?? []).filter(Boolean);
    if (!legs.length) {
      lines.push(`  ${i + 1}. no legs in this journey`);
      return;
    }
    const first = legs[0];
    const last = legs[legs.length - 1];
    const depart = Date.parse(String(first.departure ?? first.plannedDeparture ?? ''));
    const arrive = Date.parse(String(last.arrival ?? last.plannedArrival ?? ''));
    const minutes = Number.isFinite(depart) && Number.isFinite(arrive) ? (arrive - depart) / 60000 : NaN;
    const transfers = legs.filter((l) => l.transfer && Number(l.transfer.duration ?? 0) > 0).length;
    const changes = Math.max(0, legs.filter(l => l.line || l.tripId).length - 1);
    lines.push('');
    lines.push(
      `  ${i + 1}. ${bjDate(first.departure ?? first.plannedDeparture)} ${bjWhen(first.departure ?? first.plannedDeparture)} to ${bjWhen(last.arrival ?? last.plannedArrival)} UTC, ${bjDuration(minutes)}` +
        (changes ? `, ${changes} change${changes === 1 ? '' : 's'}` : ', direct') +
        (transfers ? ` (${transfers} interchange wait(s) reported)` : ''),
    );
    legs.forEach((l, k) => {
      const route = l.line?.name ?? l.trip?.route?.shortName ?? l.trip?.route?.name ?? null;
      const platform = l.departurePlatform ?? l.plannedDeparturePlatform ?? null;
      const delay = l.departureDelay;
      const kind = l.walking || l.walk ? 'walk' : l.line || l.tripId || l.trip ? 'ride' : 'leg';
      const operator = l.line?.operator?.name ?? l.trip?.route?.operator?.name;
      lines.push(
        `     ${k + 1}. ${kind} ${bjPlace(l.origin)} -> ${bjPlace(l.destination)}` +
          (route ? ` on ${route}${l.direction ? ` towards ${l.direction}` : ''}` : '') +
          (platform ? ` from platform ${platform}` : '') +
          (operator ? ` (${operator})` : '') +
          (delay == null ? ', departure delay not reported' : delay === 0 ? ', departure on time' : `, departure ${bjDuration(Math.abs(delay) / 60)} ${delay > 0 ? 'late' : 'early'}`),
      );
      if (l.transfer && Number(l.transfer.duration ?? 0) > 0) {
        const t = l.transfer;
        lines.push(
          `        interchange at ${t.place?.name ?? 'not reported'}` +
            (t.fromPlatform?.name && t.toPlatform?.name ? `, platform ${t.fromPlatform.name} to ${t.toPlatform.name}` : '') +
            `, ${bjDuration(Number(t.duration))}`,
        );
      }
    });
  });
  lines.push('');
  lines.push('  Departure and arrival times are what transport.rest reports for the requested day; the realtime leg is only present when the day is today.');
  return lines.join('\n');
}

// ---- gap4c4 tools:

interface BvgBoardRow {
  when?: string | null;
  plannedWhen?: string;
  delay?: number | null;
  cancelled?: boolean;
  direction?: string;
  line?: { name?: string; product?: string; mode?: string };
  occupancy?: string | null;
  remarks?: { text?: string }[];
}

async function bvgBoard(id: string): Promise<BvgBoardRow[]> {
  if (!/^[\w-]{1,32}$/.test(id)) throw new Error('Provide a stop id from stops.')
  const res = await fetch(`${BASE}/stops/${encodeURIComponent(id)}/departures?duration=60&results=100&remarks=true`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new Error(`transport.rest returned ${res.status}`)
  const d = await res.json() as { departures?: BvgBoardRow[] }
  if (!Array.isArray(d.departures)) throw new Error('transport.rest did not return a departure board.')
  return d.departures.slice(0, 100)
}

export async function stopBoardByMode(args: { id: string }): Promise<string> {
  const rows = await bvgBoard(args.id.trim())
  if (!rows.length) return `No departures reported at ${args.id} in the next hour.`
  const groups = new Map<string,BvgBoardRow[]>()
  for (const row of rows) {
    const key=row.line?.product??row.line?.mode??'transport not reported'
    groups.set(key,[...(groups.get(key)??[]),row])
  }
  return [`Transport at ${args.id}: next-hour sample of ${rows.length} departures, capped at 100`, ...[...groups].slice(0,15).map(([mode,group])=> {
    const times=group.filter(r=>!r.cancelled).map(r=>r.when??r.plannedWhen).filter((s):s is string=>!!s && Number.isFinite(Date.parse(s))).sort((a,b)=>Date.parse(a)-Date.parse(b))
    const lines=[...new Set(group.map(r=>r.line?.name).filter(Boolean))].slice(0,20)
    const loads=[...new Set(group.map(r=>r.occupancy).filter(Boolean))].slice(0,10)
    return `${mode}: ${group.length} departures | lines ${lines.join(', ')||'not reported'} | soonest ${times[0]??'not reported'} | reported occupancy ${loads.join(', ')||'not reported'}`
  })].join('\n')
}
