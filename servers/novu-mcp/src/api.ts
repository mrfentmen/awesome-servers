export class NovuError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NovuError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function base(): string {
  return (process.env.NOVU_BASE_URL ?? "https://api.novu.co/v1").replace(/\/$/, "");
}

function headers(): Record<string, string> {
  const k = process.env.NOVU_API_KEY;
  if (!k) throw new NovuError("Set NOVU_API_KEY (Novu dashboard).");
  return { ...UA, Accept: "application/json", Authorization: `ApiKey ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(base() + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new NovuError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new NovuError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function listSubscribers(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  return get(`/subscribers?page=0&limit=${n}`);
}

export function getSubscriber(subscriberId: string): Promise<string> {
  return get(`/subscribers/${encodeURIComponent(subscriberId)}`);
}

export function listTopics(): Promise<string> {
  return get("/topics?page=0&limit=20");
}



export function topicDetails(topicKey: string): Promise<string> {
  return get(`/topics/${encodeURIComponent(topicKey)}`);
}

export function notifications(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  return get(`/notifications?page=0&limit=${n}`);
}

export function environments(): Promise<string> {
  return get("/environments");
}

export function integrations(): Promise<string> {
  return get("/integrations");
}

export function layouts(): Promise<string> {
  return get("/layouts?page=0&limit=20");
}

export function feeds(): Promise<string> {
  return get("/feeds");
}

export function blueprintGroups(): Promise<string> {
  return get("/blueprints/grouped");
}

// ---- muxF tools:
/**
 * Novu's own API needs a secret. Its published OpenAPI document and the npm
 * registry entries for its SDKs are both public, and between them they answer
 * what the API surface is and what the client libraries are doing.
 */
const NOV_SPEC = "https://docs.novu.co/openapi.json";
const NOV_REGISTRY = "https://registry.npmjs.org";
const NOV_DOWNLOADS = "https://api.npmjs.org/downloads";

interface NovSpec {
  openapi?: string;
  info?: { title?: string; version?: string; description?: string };
  servers?: Array<{ url?: string; description?: string }>;
  paths?: Record<string, Record<string, unknown>>;
  components?: { securitySchemes?: Record<string, { type?: string; scheme?: string; description?: string }> };
  security?: Array<Record<string, string[]>>;
  tags?: Array<{ name?: string; description?: string }>;
}

interface NovDownload {
  downloads?: number;
  start?: string;
  end?: string;
  package?: string;
}

const NOV_METHODS = ["get", "post", "put", "patch", "delete", "head", "options"] as const;

const novPlain = (value: unknown, max = 130): string =>
  String(value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

async function novJson<T>(url: string, what: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { headers: { ...UA, Accept: "application/json" }, signal: AbortSignal.timeout(40000) });
  } catch (e) {
    throw new NovuError(`Network error: ${(e as Error).message}`);
  }
  if (res.status === 404) throw new NovuError(`No ${what} at that address.`);
  if (!res.ok) throw new NovuError(`The source returned HTTP ${res.status} for ${what}.`);
  const body = (await res.text()).trim();
  if (!body) throw new NovuError(`The source returned an empty body for ${what}.`);
  return JSON.parse(body) as T;
}

/** Audit Novu's own published OpenAPI document, the way a builder reads it. */
export async function notificationApiAudit(args: { limit?: number; filter?: string }): Promise<string> {
  const n = Math.min(Math.max(Number(args?.limit ?? 12) || 12, 1), 30);
  const filter = String(args?.filter ?? "").trim().toLowerCase();
  const spec = await novJson<NovSpec>(NOV_SPEC, "the Novu OpenAPI document");

  const paths = spec.paths ?? {};
  const rows: Array<{ path: string; method: string; op: Record<string, unknown> }> = [];
  for (const [path, item] of Object.entries(paths)) {
    for (const method of NOV_METHODS) {
      const op = (item ?? {})[method];
      if (op && typeof op === "object") {
        const row = { path, method, op: op as Record<string, unknown> };
        const operationId = String((op as Record<string, unknown>).operationId ?? "");
        if (!filter || path.includes(filter) || operationId.toLowerCase().includes(filter)) rows.push(row);
      }
    }
  }
  if (!rows.length) {
    throw new NovuError(
      filter
        ? `The Novu document has no operation whose path or operationId contains "${filter}".`
        : "The Novu document declares no operations.",
    );
  }

  const noSummary = rows.filter((r) => !String(r.op.summary ?? "").trim() && !String(r.op.description ?? "").trim());
  const deprecated = rows.filter((r) => r.op.deprecated === true);
  const schemes = spec.components?.securitySchemes ?? {};
  const tagCount = new Map<string, number>();
  for (const row of rows) {
    const tags = Array.isArray(row.op.tags) ? (row.op.tags as unknown[]) : [];
    for (const tag of tags) tagCount.set(String(tag), (tagCount.get(String(tag)) ?? 0) + 1);
  }
  const servers = spec.servers ?? [];

  const lines = [
    `Novu OpenAPI ${spec.openapi ?? "version not reported"}: ${spec.info?.title ?? "untitled"} ${spec.info?.version ?? ""}`.trim(),
    `  document: ${NOV_SPEC}`,
    `  ${novPlain(spec.info?.description, 150) || "no description in the document"}`,
    `  servers: ${servers.length ? servers.map((s) => s.url).filter(Boolean).slice(0, 4).join(", ") : "none declared"}`,
    `  operations matching${filter ? ` "${filter}"` : ""}: ${rows.length} across ${new Set(rows.map((r) => r.path)).size} path(s)`,
    `  quality: ${noSummary.length} operation(s) with no summary or description, ${deprecated.length} marked deprecated`,
    `  auth: ${Object.entries(schemes).map(([name, s]) => `${name} (${s.type ?? "not reported"}${s.scheme ? `/${s.scheme}` : ""})`).join(", ") || "no security scheme declared"}${spec.security?.length ? ", with a global security requirement" : ", no global security requirement"}`,
    `  busiest tag(s): ${[...tagCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([tag, count]) => `${tag} (${count})`).join(", ") || "none"}`,
    "",
    "  method  path                                      operationId                     tags",
  ];
  for (const row of rows.slice(0, n)) {
    const tags = Array.isArray(row.op.tags) ? (row.op.tags as unknown[]).join("/") : "none";
    lines.push(
      `  ${row.method.toUpperCase().padEnd(7)}${row.path.slice(0, 41).padEnd(42)}${String(row.op.operationId ?? "(none)").slice(0, 31).padEnd(32)}${tags.slice(0, 20)}${row.op.deprecated === true ? "  deprecated" : ""}`,
    );
  }
  if (rows.length > n) lines.push(`  ...and ${rows.length - n} more operation(s).`);
  return lines.join("\n");
}

/** How current and how used one of Novu's published SDK packages is. */
export async function novuSdkReleaseCheck(args: { package: string; limit?: number }): Promise<string> {
  const name = String(args?.package ?? "").trim() || "@novu/node";
  if (!/^@?[\w][\w.\-/@]{0,120}$/.test(name)) throw new NovuError(`"${args?.package}" is not an npm package name.`);
  const n = Math.min(Math.max(Number(args?.limit ?? 6) || 6, 1), 20);

  const registry = await novJson<{
    "dist-tags"?: Record<string, string>;
    time?: Record<string, string>;
    versions?: Record<string, { deprecated?: string; license?: string; description?: string }>;
  }>(`${NOV_REGISTRY}/${encodeURIComponent(name).replace("%40", "@")}`, `an npm entry for ${name}`);
  const tags = registry["dist-tags"] ?? {};
  const latest = tags.latest;
  if (!latest) throw new NovuError(`The npm registry has no latest tag for ${name}.`);
  const times = registry.time ?? {};
  const versions = Object.keys(registry.versions ?? {});
  const releases = Object.entries(times)
    .filter(([version]) => /^\d+\.\d+\.\d+/.test(version))
    .sort((a, b) => Date.parse(a[1]) - Date.parse(b[1]));
  const encoded = encodeURIComponent(name).replace("%40", "@");
  const downloads = await novJson<NovDownload>(`${NOV_DOWNLOADS}/point/last-month/${encoded}`, `a download count for ${name}`).catch((): NovDownload => ({}));
  const deprecated = versions.filter((version) => Boolean(registry.versions?.[version]?.deprecated));

  const published = times[latest] ? Date.parse(times[latest]) : NaN;
  const ageDays = Number.isFinite(published) ? Math.round((Date.now() - published) / 86_400_000) : null;
  const recent = releases.slice(-n).reverse();
  const lastYear = releases.filter(([, at]) => Date.parse(at) > Date.now() - 365 * 86_400_000).length;

  const lines = [
    `${name} on npm`,
    `  latest ${latest}${ageDays !== null ? `, published ${String(times[latest]).slice(0, 10)} (${ageDays} day(s) ago)` : ""}`,
    `  dist-tags: ${Object.entries(tags).map(([tag, version]) => `${tag}=${version}`).join(", ")}`,
    `  ${versions.length} version(s) on the registry, ${lastYear} released in the last 365 days${releases.length > 1 ? `, first ${releases[0][0]} on ${String(releases[0][1]).slice(0, 10)}` : ""}`,
    registry.versions?.[latest]?.description ? `  ${novPlain(registry.versions[latest]?.description, 140)}` : "",
    typeof downloads.downloads === "number"
      ? `  downloads in the month to ${downloads.end ?? "not reported"}: ${downloads.downloads.toLocaleString("en-US")} (about ${Math.round(downloads.downloads / 30).toLocaleString("en-US")} a day)`
      : "  download count: the registry did not report one for this package",
    deprecated.length ? `  deprecated versions: ${deprecated.length}${deprecated.length <= 5 ? ` (${deprecated.slice(0, 5).join(", ")}${deprecated.length > 5 ? "..." : ""})` : ""}` : "",
  ].filter(Boolean);
  if (recent.length) {
    lines.push("");
    lines.push("  version     published");
    for (const [version, at] of recent) lines.push(`  ${version.padEnd(11)}${String(at).slice(0, 10)}`);
  }
  return lines.join("\n");
}
