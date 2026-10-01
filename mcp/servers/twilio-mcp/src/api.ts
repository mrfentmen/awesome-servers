// ---- muxH tools:
// The nine account tools in server.ts all call the account-scoped Twilio REST API,
// which needs an account SID and auth token. component_reliability reads Twilio's
// own public status service instead, which needs no credentials at all, and
// answers the question a developer asks when a message will not send: is Twilio
// itself broken, and if so where and how badly. incident_history moved to the
// licence gateway (src/gateway.ts).

const TW_STATUS = "https://status.twilio.com/api/v2";
const TW_UA = "mcfentmen-twilio-mcp/1.1 (https://github.com/mcfentmen/twilio-mcp)";

interface TwStatusPage {
  id?: string;
  name?: string;
  url?: string;
  time_zone?: string;
  updated_at?: string;
}
interface TwStatusComponent {
  id?: string;
  name?: string;
  status?: string;
  updated_at?: string;
}
interface TwIncidentUpdate {
  status?: string;
  body?: string;
  created_at?: string;
}
interface TwIncident {
  id?: string;
  name?: string;
  status?: string;
  impact?: string;
  created_at?: string;
  updated_at?: string;
  monitoring_at?: string;
  resolved_at?: string | null;
  shortlink?: string;
  incident_updates?: TwIncidentUpdate[];
  components?: TwStatusComponent[];
}
interface TwStatusResponse {
  page?: TwStatusPage;
  status?: { indicator?: string; description?: string };
  active_incidents?: TwIncident[];
}
interface TwIncidentsResponse {
  page?: TwStatusPage;
  incidents?: TwIncident[];
}

async function twStatusGet<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${TW_STATUS}/${path}`, {
      headers: { "User-Agent": TW_UA, Accept: "application/json" },
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new Error(`Could not reach Twilio's status service: ${(e as Error).message}`);
  }
  if (!res.ok) throw new Error(`Twilio's status service returned HTTP ${res.status}.`);
  return (await res.json()) as T;
}

const twMinutes = (from?: string, to?: string): number | null => {
  const a = Date.parse(String(from ?? ""));
  const b = Date.parse(String(to ?? ""));
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return null;
  return Math.round((b - a) / 60000);
};
const twSpan = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(1)} h`;
  return `${(minutes / 1440).toFixed(1)} days`;
};
/**
 * Which parts of Twilio break most often. This reads the same published record but
 * asks the aggregate question: how many incidents named each component, how long
 * they lasted there, and what state that component is in now.
 */
export async function componentReliability(args: { limit?: number; days?: number }): Promise<string> {
  const limit = Math.min(Math.max(Number(args?.limit ?? 12) || 12, 1), 40);
  const days = Math.min(Math.max(Number(args?.days ?? 90) || 90, 7), 365);

  const [payload, current] = await Promise.all([
    twStatusGet<TwIncidentsResponse>("incidents.json"),
    twStatusGet<TwStatusResponse>("status.json"),
  ]);
  const all = payload.incidents ?? [];
  if (!all.length) throw new Error("Twilio's status service returned no incidents.");

  const cutoff = Date.now() - days * 86400000;
  const window = all.filter((i) => Date.parse(String(i.created_at ?? "")) >= cutoff);
  if (!window.length) {
    return `Twilio published no incident in the last ${days} days. Overall status now: ${current.status?.description ?? current.status?.indicator ?? "not reported"}.`;
  }

  interface Stat {
    name: string;
    incidents: number;
    minutes: number[];
    worst: string | null;
    state: string;
  }
  const stats = new Map<string, Stat>();
  const nowState = new Map<string, string>();
  for (const incident of window) {
    for (const component of incident.components ?? []) {
      const name = component.name ?? "component not named";
      const stat = stats.get(name) ?? { name, incidents: 0, minutes: [], worst: null, state: "not reported" };
      stat.incidents += 1;
      const span = twMinutes(incident.created_at, incident.resolved_at ?? undefined);
      if (span !== null) stat.minutes.push(span);
      if (!stat.worst || String(incident.impact ?? "") === "major") stat.worst = incident.name ?? "untitled";
      if (component.status) stat.state = component.status;
      stats.set(name, stat);
    }
  }
  for (const component of current.active_incidents ?? []) {
    for (const c of component.components ?? []) if (c.name && c.status) nowState.set(c.name, c.status);
  }

  const ranked = [...stats.values()].sort((a, b) => b.incidents - a.incidents || a.name.localeCompare(b.name));
  const totalDown = window.length;
  const impacts = new Map<string, number>();
  for (const incident of window) {
    const key = incident.impact ?? "not reported";
    impacts.set(key, (impacts.get(key) ?? 0) + 1);
  }
  const totalMinutes = window
    .map((i) => twMinutes(i.created_at, i.resolved_at ?? undefined))
    .filter((n): n is number => n !== null);
  const indicator = current.status?.indicator ?? "not reported";
  const maxCount = ranked[0]?.incidents ?? 1;

  const lines = [
    `Twilio component reliability, last ${days} days`,
    `  ${window.length} of ${all.length} published incident(s) fall in this window`,
    `  overall status now: ${indicator}${current.status?.description ? ` (${current.status.description})` : ""}`,
    `  ${[...impacts.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${n} ${k}`).join(", ")} impact rating(s)`,
    totalMinutes.length
      ? `  incidents with a resolution time ran a mean of ${twSpan(Math.round(totalMinutes.reduce((a, b) => a + b, 0) / totalMinutes.length))}, longest ${twSpan(Math.max(...totalMinutes))}`
      : "  no incident in this window has a resolution time yet",
    `  ${nowState.size ? `${nowState.size} component(s) named in an incident open right now` : "no component is named in an incident open right now"}`,
    "",
    "Most affected components:",
    ...ranked.slice(0, limit).map((stat, i) => {
      const mean = stat.minutes.length ? Math.round(stat.minutes.reduce((a, b) => a + b, 0) / stat.minutes.length) : null;
      const live = nowState.get(stat.name);
      return (
        `  ${String(i + 1).padStart(2)}. ${stat.name.slice(0, 40).padEnd(40)} ${String(stat.incidents).padStart(3)} incident(s)` +
        `  mean ${mean !== null ? twSpan(mean).padStart(9) : "     open"}  ${live ? `NOW ${live}` : `last seen ${stat.state}`}  ${"#".repeat(Math.max(1, Math.round((stat.incidents / maxCount) * 18)))}`
      );
    }),
    ...(ranked.length > limit ? [`  (+${ranked.length - limit} further component(s) not shown)`] : []),
    "",
    "Least affected of those listed:",
    `  ${ranked[ranked.length - 1]?.name ?? "not reported"} with ${ranked[ranked.length - 1]?.incidents ?? 0} incident(s) in the window`,
    "",
    `An incident naming several components is counted once under each, so the column sums to more than ${totalDown}. Components are Twilio's own status-page groupings, which mix a product with a region ("SMS, APAC"), so a region-specific outage counts against that region only. This is a public status record, not a service-level report, and it excludes anything below Twilio's reporting threshold.`,
  ];
  return lines.join("\n");
}
