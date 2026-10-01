/**
 * Wise API client. Requires WISE_API_TOKEN.
 * Create a free token in your Wise account (Settings > API tokens).
 * Docs: https://docs.wise.com/api-docs/
 */
const BASE = "https://api.wise.com"

export class WiseError extends Error {}

function token(): string {
  const t = process.env.WISE_API_TOKEN
  if (!t) throw new WiseError("Set WISE_API_TOKEN first (free in your Wise account settings).")
  return t
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "wise-mcp/1.0", Accept: "application/json", Authorization: `Bearer ${token()}` },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new WiseError("Wise rejected the token (401/403). Check WISE_API_TOKEN.")
  if (res.status === 404) throw new WiseError("Not found.")
  if (!res.ok) throw new WiseError(`Wise error ${res.status}`)
  return (await res.json()) as T
}

export interface Profile {
  id: number
  type?: string
  name?: string
}

export async function listProfiles(): Promise<Profile[]> {
  const rows = await getJson<Raw[]>("/v2/profiles")
  return rows.map((p) => ({
    id: Number(p.id),
    type: p.type,
    name: p.details ? String(p.details.firstName ?? p.details.name ?? p.details.businessName ?? "") : undefined,
  }))
}

export interface Balance {
  currency?: string
  amount?: number
}

export async function getBalances(profileId: string): Promise<Balance[]> {
  if (!/^\d+$/.test(profileId.trim())) throw new WiseError(`Profile id must be numeric, got "${profileId}".`)
  const data = await getJson<Raw[]>(`/v4/profiles/${profileId.trim()}/balances?types=STANDARD`)
  return data.flatMap((b) =>
    (Array.isArray(b.balances) ? b.balances : []).map((x: Raw) => ({
      currency: x.currency,
      amount: typeof x.amount?.value === "number" ? x.amount.value : undefined,
    }))
  )
}

export async function exchangeRate(from: string, to: string): Promise<number> {
  const data = await getJson<Raw>(`/v1/rates?source=${encodeURIComponent(from.trim().toUpperCase())}&target=${encodeURIComponent(to.trim().toUpperCase())}`)
  const rows: Raw[] = Array.isArray(data) ? data : []
  const rate = rows.length > 0 ? Number(rows[0].rate) : NaN
  if (!isFinite(rate)) throw new WiseError(`No rate for ${from} to ${to}.`)
  return rate
}

// ---- muxH tools:
// The three tools above call Wise's API with a personal token and report the
// caller's own profiles, balances and a live exchange rate. These two need no
// token: they read Wise's public status record, which is the thing to read when a
// transfer, a rate or a card is not behaving and the question is whether Wise or
// the caller is at fault.

const WI_UA = "mcfentmen-wise-mcp/1.2 (https://github.com/mcfentmen/wise-mcp)";
const WI_STATUS = "https://status.wise.com/api/v2";

interface WiItem {
  id?: string;
  name?: string;
  status?: string;
  impact?: string;
  created_at?: string;
  monitoring_at?: string | null;
  resolved_at?: string | null;
  shortlink?: string;
  components?: { name?: string; status?: string }[];
  incident_updates?: { status?: string; body?: string; created_at?: string }[];
  scheduled_for?: string;
  scheduled_until?: string;
}
interface WiDoc {
  page?: { name?: string; url?: string; time_zone?: string; updated_at?: string };
  status?: { indicator?: string; description?: string };
  components?: WiItem[];
  incidents?: WiItem[];
  scheduled_maintenances?: WiItem[];
}

async function wiGet<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${WI_STATUS}/${path}`, { headers: { "User-Agent": WI_UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) });
  } catch (e) {
    throw new Error(`Could not reach Wise's status service: ${(e as Error).message}`);
  }
  if (!res.ok) throw new Error(`Wise's status service returned HTTP ${res.status} for ${path}.`);
  return (await res.json()) as T;
}

/** Statuspage component names here carry an emoji, which is stripped for reading. */
const wiLabel = (raw?: string): string =>
  String(raw ?? "unnamed").replace(/\p{Extended_Pictographic}/gu, "").replace(/^\s+|\s+$/g, "").replace(/\s{2,}/g, " ");

const wiMinutes = (from?: string, to?: string | null): number | null => {
  if (!to) return null;
  const a = Date.parse(String(from ?? ""));
  const b = Date.parse(String(to));
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return null;
  return Math.round((b - a) / 60000);
};
const wiSpan = (m: number): string => (m < 60 ? `${m} min` : m < 1440 ? `${(m / 60).toFixed(1)} h` : `${(m / 1440).toFixed(1)} days`);
const wiClean = (raw?: string): string =>
  String(raw ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Which parts of Wise are working right now, and which have a declared fault.
 * Every component is listed with its own state, because a transfer working while
 * the card does not is a specific and common problem that an overall indicator
 * would hide.
 */
export async function serviceHealth(args: { limit?: number }): Promise<string> {
  const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 40);
  const [summary, incidents] = await Promise.all([wiGet<WiDoc>("summary.json"), wiGet<WiDoc>("incidents.json")]);
  const components = summary.components ?? [];
  const all = incidents.incidents ?? [];
  if (!components.length && !summary.status) throw new Error("Wise's status service returned neither a status nor any components.");

  const stateOf = new Map(components.map((c) => [wiLabel(c.name), c.status ?? "not reported"]));
  const hits = new Map<string, { count: number; minutes: number[]; worst: string | null; worstImpact: string }>();
  for (const incident of all) {
    const span = wiMinutes(incident.created_at, incident.resolved_at ?? undefined);
    for (const component of incident.components ?? []) {
      const name = wiLabel(component.name);
      const entry = hits.get(name) ?? { count: 0, minutes: [], worst: null, worstImpact: "not reported" };
      entry.count += 1;
      if (span !== null) entry.minutes.push(span);
      if (incident.impact === "critical" || incident.impact === "major") {
        entry.worst = incident.name ?? "untitled";
        entry.worstImpact = incident.impact ?? "not reported";
      }
      hits.set(name, entry);
    }
  }
  const maintenance = summary.scheduled_maintenances ?? [];
  const open = all.filter((i) => i.status !== "resolved" && i.status !== "completed");
  const down = components.filter((c) => c.status && c.status !== "operational");

  return [
    `Wise service health, from the public status record`,
    `  overall: ${String(summary.status?.indicator ?? "not reported").toUpperCase()} — ${summary.status?.description ?? "not reported"}`,
    `  page last updated ${summary.page?.updated_at ?? "not reported"} (${summary.page?.time_zone ?? "timezone not reported"})`,
    `  ${components.length} component(s), ${down.length} not operational | ${all.length} published incident(s)${open.length ? `, ${open.length} still open` : ", all resolved"}`,
    maintenance.length ? `  ${maintenance.length} scheduled maintenance window(s) published` : "  no scheduled maintenance published",
    "",
    `Components${down.length ? ", unhealthy first" : ""}:`,
    ...[...components]
      .sort((a, b) => Number(String(a.status) !== "operational") - Number(String(b.status) !== "operational"))
      .slice(0, limit)
      .map((c) => {
        const name = wiLabel(c.name);
        const hit = hits.get(name);
        const mean = hit?.minutes.length ? Math.round(hit.minutes.reduce((a, b) => a + b, 0) / hit.minutes.length) : null;
        return (
          `  ${name.slice(0, 26).padEnd(26)}${String(c.status ?? "not reported").padEnd(14)}` +
          `${String(hit?.count ?? 0).padStart(3)} incident(s)${mean !== null ? `  mean ${wiSpan(mean).padStart(9)}` : ""}` +
          `${hit?.worst ? `  worst: ${wiClean(hit.worst).slice(0, 44)}` : ""}`
        );
      }),
    ...(components.length > limit ? [`  (+${components.length - limit} further component(s) not shown)`] : []),
    "",
    ...(open.length
      ? ["Open incidents:"]
      : ["Open incidents: none in the published record."]),
    ...open.slice(0, 5).map((i) =>
      `  - ${i.name ?? "untitled"} (${i.status ?? "?"}, impact ${i.impact ?? "not reported"}) since ${String(i.created_at ?? "?").slice(0, 16).replace("T", " ")}` +
      `${(i.components ?? []).length ? ` | ${(i.components ?? []).map((c) => wiLabel(c.name)).join(", ")}` : ""}`,
    ),
    ...(maintenance.length
      ? [
          "",
          "Scheduled:",
          ...maintenance.slice(0, 4).map((m) =>
            `  - ${m.name ?? "untitled"} (${m.status ?? "?"}, impact ${m.impact ?? "not reported"})` +
            `${m.scheduled_for ? ` ${String(m.scheduled_for).slice(0, 16).replace("T", " ")} to ${String(m.scheduled_until ?? "?").slice(0, 16).replace("T", " ")}` : ""}`,
          ),
        ]
      : []),
    "",
    "A component marked operational means Wise is not currently reporting a fault against it, which is not the same as a transfer having gone through; Wise publishes only what clears its own reporting threshold, so an issue that never reaches that bar never appears here. Impact ratings are Wise's own and 'none' is a real value meaning a fault with no measured customer effect.",
  ].join("\n");
}

/**
 * Wise's incident record read as a reliability history: which product area breaks
 * most often, how long each fault lasted, and what the record says about a single
 * area over time. The question behind it is whether a problem is a one-off or a
 * pattern, which a single status page cannot show.
 */
export async function incidentHistory(args: { area?: string; limit?: number }): Promise<string> {
  const area = String(args?.area ?? "").trim().toLowerCase();
  const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 30);
  const incidents = await wiGet<WiDoc>("incidents.json");
  const all = incidents.incidents ?? [];
  if (!all.length) throw new Error("Wise's status service returned no incidents.");

  const areas = [...new Set(all.flatMap((i) => (i.components ?? []).map((c) => wiLabel(c.name))))].sort();
  const pool = area ? all.filter((i) => (i.components ?? []).some((c) => wiLabel(c.name).toLowerCase().includes(area))) : all;
  if (!pool.length) {
    return `No incident among Wise's ${all.length} published records touches an area matching "${args.area}". Areas that do appear: ${areas.join(", ")}.`;
  }

  const perArea = new Map<string, { count: number; minutes: number[]; impacts: Map<string, number> }>();
  for (const incident of pool) {
    const span = wiMinutes(incident.created_at, incident.resolved_at ?? undefined);
    for (const component of incident.components ?? []) {
      const name = wiLabel(component.name);
      const entry = perArea.get(name) ?? { count: 0, minutes: [], impacts: new Map<string, number>() };
      entry.count += 1;
      if (span !== null) entry.minutes.push(span);
      const impact = incident.impact ?? "not reported";
      entry.impacts.set(impact, (entry.impacts.get(impact) ?? 0) + 1);
      perArea.set(name, entry);
    }
  }
  const durations = pool.map((i) => wiMinutes(i.created_at, i.resolved_at ?? undefined)).filter((n): n is number => n !== null);
  const byYear = new Map<string, number>();
  for (const incident of pool) {
    const year = String(incident.created_at ?? "").slice(0, 4);
    if (/^\d{4}$/.test(year)) byYear.set(year, (byYear.get(year) ?? 0) + 1);
  }
  const impactTally = new Map<string, number>();
  for (const incident of pool) {
    const key = incident.impact ?? "not reported";
    impactTally.set(key, (impactTally.get(key) ?? 0) + 1);
  }

  return [
    `Wise incident history${area ? ` for areas matching "${args.area}"` : ""}`,
    `  ${pool.length} of ${all.length} published incident(s) in selection`,
    `  by impact: ${[...impactTally.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${n} ${k}`).join(", ")}`,
    ...(durations.length
      ? [`  resolution: mean ${wiSpan(Math.round(durations.reduce((a, b) => a + b, 0) / durations.length))}, median ${wiSpan([...durations].sort((a, b) => a - b)[Math.floor(durations.length / 2)])}, longest ${wiSpan(Math.max(...durations))}`]
      : ["  no incident in this selection carries a resolution time"]),
    ...(byYear.size
      ? [`  by year: ${[...byYear.entries()].sort().map(([y, n]) => `${y}: ${n}`).join("  ")}`]
      : []),
    "",
    "By product area, most affected first:",
    ...[...perArea.entries()]
      .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
      .slice(0, limit)
      .map(([name, stat]) => {
        const mean = stat.minutes.length ? Math.round(stat.minutes.reduce((a, b) => a + b, 0) / stat.minutes.length) : null;
        return (
          `  ${name.slice(0, 26).padEnd(26)}${String(stat.count).padStart(3)} incident(s)` +
          `${mean !== null ? `  mean ${wiSpan(mean).padStart(9)}` : "  not all resolved"}` +
          `  ${[...stat.impacts.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${n} ${k}`).join(", ")}  ${"#".repeat(Math.max(1, Math.round((stat.count / ([...perArea.values()][0]?.count || 1)) * 20)))}`
        );
      }),
    "",
    "Most recent incidents in selection:",
    ...pool
      .slice()
      .sort((a, b) => (String(b.created_at ?? "") < String(a.created_at ?? "") ? -1 : 1))
      .slice(0, limit)
      .map((incident, i) => {
        const span = wiMinutes(incident.created_at, incident.resolved_at ?? undefined);
        const updates = incident.incident_updates ?? [];
        const last = updates.length ? updates[updates.length - 1] : null;
        return [
          `  ${String(i + 1).padStart(2)}. ${String(incident.created_at ?? "?").slice(0, 10)}  ${wiClean(incident.name ?? "untitled").slice(0, 56).padEnd(56)} ${incident.impact ?? "?"}`,
          `      ${incident.status ?? "?"}${span !== null ? ` after ${wiSpan(span)}` : ""} | ${(incident.components ?? []).map((c) => wiLabel(c.name)).join(", ") || "no area named"} | ${updates.length} update(s)`,
          ...(last ? [`      latest: ${wiClean(last.body).slice(0, 150) || "empty note"}`] : []),
        ].join("\n");
      }),
    "",
    "An incident is counted once under each area it names, so the area column sums above the incident total, and one fault on the API may well also have hit the app. This is Wise's own published record: it covers what Wise declared, and a quiet period is not evidence that nothing went wrong.",
  ].join("\n");
}
