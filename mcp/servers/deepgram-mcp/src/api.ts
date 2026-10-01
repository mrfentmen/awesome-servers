export class DeepgramError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DeepgramError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://api.deepgram.com/v1";

function headers(): Record<string, string> {
  const k = process.env.DEEPGRAM_API_KEY;
  if (!k) throw new DeepgramError("Set DEEPGRAM_API_KEY (free Deepgram tier).");
  return { ...UA, Accept: "application/json", Authorization: `Token ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(BASE + path, { signal: AbortSignal.timeout(30000), headers: headers() });
  } catch (e) {
    throw new DeepgramError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new DeepgramError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

export function listProjects(): Promise<string> {
  return get("/projects");
}

export function getBalance(projectId: string): Promise<string> {
  return get(`/projects/${encodeURIComponent(projectId)}/balances`);
}

export function listKeys(projectId: string): Promise<string> {
  return get(`/projects/${encodeURIComponent(projectId)}/keys`);
}

// ---- muxD tools:

async function getJson<T>(path: string): Promise<T> {
  const raw = await get(path);
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new DeepgramError(`Deepgram returned a non-JSON body for ${path}: ${raw.slice(0, 200)}`);
  }
}

/**
 * Number(null) and Number("") are both 0, so a missing Deepgram metric would read
 * as a genuine zero and quietly distort totals and shares. Treat blank as absent.
 */
const dgNum = (v: unknown): number => {
  if (v === null || v === undefined || v === "") return NaN;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};

const dgStamp = (v: unknown): string => {
  const t = Date.parse(String(v ?? ""));
  return Number.isFinite(t) ? new Date(t).toISOString().replace("T", " ").slice(0, 19) + "Z" : String(v ?? "?");
};

const dgUsd = (n: number): string =>
  Number.isFinite(n) ? `$${n.toFixed(n < 0.01 ? 6 : 4).replace(/0+$/, "").replace(/\.$/, ".0")}` : "n/a";

const DG_ENDPOINTS = ["listen", "read", "speak", "agent"] as const;
const DG_METHODS = ["sync", "async", "streaming"] as const;
const DG_DEPLOYMENTS = ["hosted", "beta", "self-hosted"] as const;
const DG_STATUSES = ["succeeded", "failed"] as const;
const DG_GROUPINGS = ["accessor", "endpoint", "feature_set", "models", "method", "tags", "deployment"] as const;

interface DgRequest {
  request_id?: string;
  project_uuid?: string;
  created?: string;
  path?: string;
  api_key_id?: string;
  callback?: string | null;
  code?: number;
  deployment?: string;
  response?: {
    code?: number;
    completed?: string;
    deployment?: string;
    token_details?: unknown[];
    details?: {
      usd?: number;
      duration?: number;
      total_audio?: number;
      channels?: number;
      streams?: number;
      tier?: string;
      method?: string;
      models?: string[];
      tags?: string[];
      features?: string[];
      config?: Record<string, unknown>;
    };
  };
}

export interface RequestLogArgs {
  project_id: string;
  start?: string;
  end?: string;
  limit?: number;
  page?: number;
  endpoint?: string;
  method?: string;
  status?: string;
  deployment?: string;
}

/** Every request a Deepgram project has made, with the cost, audio handled and failures that are easy to miss in a bill. */
export async function requestLog(args: RequestLogArgs): Promise<string> {
  const projectId = String(args.project_id ?? "").trim();
  if (!/^[0-9a-fA-F-]{32,36}$/.test(projectId)) {
    throw new DeepgramError("Provide a project_id as a UUID. Deepgram validates the UUID format before authenticating, so a name will not work.");
  }
  const limit = Math.min(Math.max(Math.floor(dgNum(args.limit ?? 10) || 10), 1), 1000);
  const page = Math.max(Math.floor(dgNum(args.page ?? 0) || 0), 0);
  const params = new URLSearchParams({ limit: String(limit), page: String(page) });
  if (args.start) params.set("start", String(args.start));
  if (args.end) params.set("end", String(args.end));
  const pick = <T extends readonly string[]>(value: unknown, allowed: T, label: string): void => {
    const v = String(value ?? "").trim();
    if (!v) return;
    if (!allowed.includes(v)) throw new DeepgramError(`${label} must be one of ${allowed.join(", ")}.`);
    params.set(label, v);
  };
  pick(args.endpoint, DG_ENDPOINTS, "endpoint");
  pick(args.method, DG_METHODS, "method");
  pick(args.status, DG_STATUSES, "status");
  pick(args.deployment, DG_DEPLOYMENTS, "deployment");

  const body = await getJson<{ page?: number; limit?: number; requests?: DgRequest[] }>(
    `/projects/${encodeURIComponent(projectId)}/requests?${params.toString()}`,
  );
  const rows = body.requests ?? [];
  if (!rows.length) {
    return `Deepgram returned no requests for project ${projectId}${args.start ? ` from ${args.start}` : ""}${args.end ? ` to ${args.end}` : ""}${args.status ? ` with status ${args.status}` : ""}. A genuinely empty range and a filter that matches nothing look identical here.`;
  }

  let usd = 0;
  let audio = 0;
  const failures: DgRequest[] = [];
  const byEndpoint = new Map<string, { n: number; usd: number; audio: number }>();
  const byModel = new Map<string, { n: number; usd: number }>();
  const features = new Map<string, number>();
  for (const r of rows) {
    const d = r.response?.details ?? {};
    const cost = dgNum(d.usd);
    const dur = dgNum(d.total_audio ?? d.duration);
    if (Number.isFinite(cost)) usd += cost;
    if (Number.isFinite(dur)) audio += dur;
    const code = r.response?.code ?? r.code;
    if (typeof code === "number" && code >= 400) failures.push(r);
    const endpoint = (r.path ?? "").replace(/^\/v1\/?/, "").replace(/[?].*$/, "") || "?";
    const e = byEndpoint.get(endpoint) ?? { n: 0, usd: 0, audio: 0 };
    e.n += 1;
    if (Number.isFinite(cost)) e.usd += cost;
    if (Number.isFinite(dur)) e.audio += dur;
    byEndpoint.set(endpoint, e);
    for (const m of d.models ?? []) {
      const mm = byModel.get(m) ?? { n: 0, usd: 0 };
      mm.n += 1;
      if (Number.isFinite(cost)) mm.usd += cost;
      byModel.set(m, mm);
    }
    for (const f of d.features ?? []) features.set(f, (features.get(f) ?? 0) + 1);
  }

  const top = [...byEndpoint.entries()].sort((a, b) => b[1].usd - a[1].usd);
  const lines = [
    `Deepgram request log for project ${projectId}: ${rows.length} request(s) on page ${body.page ?? page} of up to ${body.limit ?? limit} per page`,
    `Total cost on this page ${dgUsd(usd)} | audio handled ${audio.toLocaleString(undefined, { maximumFractionDigits: 1 })} second(s) | failures ${failures.length}`,
    "",
    "By endpoint:",
    ...top.map(([k, v]) => `  ${k.padEnd(10)} ${String(v.n).padStart(4)} request(s)  ${dgUsd(v.usd).padStart(12)}  ${v.audio.toLocaleString(undefined, { maximumFractionDigits: 1 })}s audio`),
  ];
  const modelRows = [...byModel.entries()].sort((a, b) => b[1].usd - a[1].usd);
  if (modelRows.length) {
    lines.push("", "By model:", ...modelRows.map(([k, v]) => `  ${k.padEnd(26)} ${String(v.n).padStart(4)} request(s)  ${dgUsd(v.usd).padStart(12)}`));
  }
  if (features.size) {
    lines.push("", `Features requested: ${[...features.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ")}`);
  }
  lines.push("", "Most recent requests:");
  for (const r of rows.slice(0, 12)) {
    const d = r.response?.details ?? {};
    const code = r.response?.code ?? r.code;
    const mark = typeof code === "number" && code >= 400 ? "FAIL" : "ok  ";
    lines.push(
      `  ${mark} ${dgStamp(r.created)}  ${String(code ?? "?").padStart(3)}  ${dgUsd(dgNum(d.usd)).padStart(12)}  ` +
      `${(d.method ?? "?").padEnd(9)} ${(d.models ?? []).join(",").slice(0, 28) || "?"}`,
    );
  }
  if (rows.length > 12) lines.push(`  ...and ${rows.length - 12} more on this page.`);
  if (failures.length) {
    lines.push("", `${failures.length} request(s) returned an error status: ${failures.slice(0, 6).map((r) => `${r.request_id ?? "?"} (HTTP ${r.response?.code ?? r.code ?? "?"})`).join(", ")}${failures.length > 6 ? ", ..." : ""}`);
    lines.push("  Failed requests are usually still billed as audio handled, so check the cost column for them.");
  }
  lines.push("", "Cost is the per-request usd Deepgram recorded. Page through with page= to see beyond the first page.");
  return lines.join("\n");
}

export interface UsageBreakdownArgs {
  project_id: string;
  grouping?: string;
  start?: string;
  end?: string;
}

/** Usage grouped by whatever dimension you pick, which is how you find which model, tag or feature is burning the budget. */
export async function usageBreakdown(args: UsageBreakdownArgs): Promise<string> {
  const projectId = String(args.project_id ?? "").trim();
  if (!/^[0-9a-fA-F-]{32,36}$/.test(projectId)) {
    throw new DeepgramError("Provide a project_id as a UUID.");
  }
  const grouping = String(args.grouping ?? "endpoint").trim().toLowerCase();
  if (!(DG_GROUPINGS as readonly string[]).includes(grouping)) {
    throw new DeepgramError(`grouping must be one of ${DG_GROUPINGS.join(", ")}.`);
  }
  const params = new URLSearchParams({ grouping });
  if (args.start) params.set("start", String(args.start));
  if (args.end) params.set("end", String(args.end));

  const body = await getJson<{
    start?: string;
    end?: string;
    resolution?: { units?: string; amount?: number };
    results?: Array<{
      hours?: string;
      total_hours?: string;
      agent_hours?: string;
      tokens_in?: number;
      tokens_out?: number;
      tts_characters?: number;
      requests?: number;
      grouping?: unknown;
    }>;
  }>(`/projects/${encodeURIComponent(projectId)}/usage/breakdown?${params.toString()}`);

  const results = body.results ?? [];
  if (!results.length) {
    return `Deepgram returned no usage breakdown grouped by ${grouping} for project ${projectId}. An empty result usually means no requests in the window rather than a bad group name.`;
  }
  const label = (r: (typeof results)[number]): string => {
    const g = r.grouping;
    if (g === null || g === undefined) return "(none)";
    if (typeof g === "string" || typeof g === "number") return String(g);
    if (Array.isArray(g)) return g.length ? g.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).slice(0, 3).join(", ") : "(none)";
    if (typeof g === "object") {
      const entries = Object.entries(g as Record<string, unknown>);
      return entries.length ? entries.map(([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : String(v)}`).join(" ").slice(0, 60) : "(none)";
    }
    return String(g);
  };
  const hours = (v: unknown): number => dgNum(v);
  const sorted = [...results].sort((a, b) => hours(b.total_hours) - hours(a.total_hours));
  const sumOf = (pick: (r: (typeof results)[number]) => unknown): number =>
    results.reduce((s, r) => s + (Number.isFinite(dgNum(pick(r))) ? (dgNum(pick(r)) as number) : 0), 0);
  const totalHours = sumOf((r) => r.total_hours);
  const totalRequests = sumOf((r) => r.requests);

  const lines = [
    `Deepgram usage for project ${projectId} grouped by ${grouping}`,
    `Window ${body.start ?? "?"} to ${body.end ?? "?"}${body.resolution?.units ? `, resolution ${body.resolution.amount ?? "?"} ${body.resolution.units}` : ""}`,
    `${results.length} group(s), ${totalRequests.toLocaleString()} request(s), ${totalHours.toLocaleString(undefined, { maximumFractionDigits: 3 })} total hours`,
    "",
    `${"group".padEnd(34)}${"requests".padStart(9)}${"hours".padStart(12)}${"share".padStart(8)}${"tokens in".padStart(11)}`,
  ];
  for (const r of sorted.slice(0, 25)) {
    const h = hours(r.total_hours);
    lines.push(
      `${label(r).slice(0, 34).padEnd(34)}${(dgNum(r.requests) || 0).toLocaleString().padStart(9)}` +
      `${(Number.isFinite(h) ? h.toFixed(3) : "?").padStart(12)}` +
      `${(totalHours > 0 && Number.isFinite(h) ? `${((h / totalHours) * 100).toFixed(1)}%` : "?").padStart(8)}` +
      `${(Number.isFinite(dgNum(r.tokens_in)) ? (dgNum(r.tokens_in) as number).toLocaleString() : "?").padStart(11)}`,
    );
  }
  if (results.length > 25) lines.push(`  ...and ${results.length - 25} more groups.`);
  const tts = sumOf((r) => r.tts_characters);
  const tokensOut = sumOf((r) => r.tokens_out);
  if (tts) lines.push("", `Text-to-speech characters billed across the window: ${tts.toLocaleString()}`);
  if (tokensOut) lines.push(`Tokens generated across the window: ${tokensOut.toLocaleString()}`);
  return lines.join("\n");
}

export interface ProjectMembersArgs {
  project_id: string;
}

/** Who has access to a Deepgram project and with which scopes, which is the access-control check for a shared project. */
export async function projectMembers(args: ProjectMembersArgs): Promise<string> {
  const projectId = String(args.project_id ?? "").trim();
  if (!/^[0-9a-fA-F-]{32,36}$/.test(projectId)) {
    throw new DeepgramError("Provide a project_id as a UUID.");
  }
  const body = await getJson<{
    members?: Array<{ member_id?: string; scopes?: unknown; email?: string; first_name?: string; last_name?: string }>;
  }>(`/projects/${encodeURIComponent(projectId)}/members`);

  const members = body.members ?? [];
  if (!members.length) {
    return `Project ${projectId} lists no members. If this is not your own project, you are reading it with a key that has project-scoped access rather than as a listed member.`;
  }
  const scopeText = (s: unknown): string => {
    if (s === null || s === undefined) return "(none reported)";
    if (Array.isArray(s)) return s.length ? s.map(String).join(", ") : "(none)";
    if (typeof s === "object") return JSON.stringify(s);
    return String(s);
  };
  const allScopes = new Set<string>();
  for (const m of members) if (Array.isArray(m.scopes)) for (const s of m.scopes) allScopes.add(String(s));

  const width = Math.max(...members.map((m) => `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim().length || String(m.email ?? "?").length), 8);
  const lines = [
    `Members of Deepgram project ${projectId}: ${members.length}`,
    `Distinct scopes in use: ${[...allScopes].sort().join(", ") || "none reported"}`,
    "",
    `${"member".padEnd(width)}  ${"scopes".padEnd(46)}  member id`,
  ];
  for (const m of members) {
    const name = `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() || m.email || "?";
    lines.push(`${name.slice(0, width).padEnd(width)}  ${scopeText(m.scopes).slice(0, 46).padEnd(46)}  ${m.member_id ?? "?"}`);
    if (m.email && `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim()) lines.push(`${" ".repeat(width)}  ${m.email}`);
  }
  lines.push("", "Anyone listed here can spend the project's balance. Remove members who no longer need access, and prefer member-scoped keys over the project owner key in application code.");
  return lines.join("\n");
}
