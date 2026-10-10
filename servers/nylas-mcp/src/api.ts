export class NylasError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NylasError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://api.us.nylas.com/v3";

function headers(): Record<string, string> {
  const k = process.env.NYLAS_API_KEY;
  if (!k) throw new NylasError("Set NYLAS_API_KEY (free Nylas tier).");
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(BASE + path, { signal: AbortSignal.timeout(30000), headers: headers() });
  } catch (e) {
    throw new NylasError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new NylasError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

export function getGrant(): Promise<string> {
  return get("/grants/me");
}

export function listCalendars(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  return get(`/calendars?limit=${n}`);
}

export function listMessages(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  return get(`/messages?limit=${n}`);
}

// ---- muxF tools:
/**
 * Nylas needs an API key. Its public OpenAPI document is not behind a key, and
 * the two questions worth asking about an email API - what can I ask for, and
 * what does the auth actually grant - are both answered there.
 */
const NY_SPEC = "https://developer.nylas.com/openapi.json";

interface NySpec {
  openapi?: string;
  info?: { title?: string; version?: string; description?: string };
  servers?: Array<{ url?: string; description?: string }>;
  paths?: Record<string, Record<string, unknown>>;
  components?: {
    securitySchemes?: Record<string, { type?: string; scheme?: string; description?: string; flows?: Record<string, { scopes?: Record<string, string> }> }>;
    schemas?: Record<string, { type?: string; description?: string; properties?: Record<string, { type?: string; description?: string; enum?: unknown[] }>; required?: string[] }>;
  };
}

interface NySecurity {
  scopes?: string[];
  description?: string;
}

const NY_METHODS = ["get", "post", "put", "patch", "delete", "head"] as const;

const nyPlain = (value: unknown, max = 140): string =>
  String(value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

async function nySpecDoc(what: string): Promise<NySpec> {
  let res: Response;
  try {
    res = await fetch(NY_SPEC, { headers: { ...UA, Accept: "application/json" }, signal: AbortSignal.timeout(45000) });
  } catch (e) {
    throw new NylasError(`Network error: ${(e as Error).message}`);
  }
  if (res.status === 404) throw new NylasError(`Nylas serves no OpenAPI document at that address for ${what}.`);
  if (!res.ok) throw new NylasError(`The Nylas document returned HTTP ${res.status} for ${what}.`);
  const body = (await res.text()).trim();
  if (!body) throw new NylasError("The Nylas document is empty.");
  try {
    return JSON.parse(body) as NySpec;
  } catch {
    throw new NylasError("The Nylas document did not parse as JSON.");
  }
}

/** What a Nylas grant can be asked to do, read from the published API document. */
export async function grantFlowAudit(args: { limit?: number }): Promise<string> {
  const n = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 30);
  const spec = await nySpecDoc("the grant and scope map");
  const schemes = spec.components?.securitySchemes ?? {};
  if (!Object.keys(schemes).length) throw new NylasError("The Nylas document declares no security scheme, so there is no grant flow to read.");

  const paths = spec.paths ?? {};
  const rows: Array<{ path: string; method: string; op: Record<string, unknown> }> = [];
  for (const [path, item] of Object.entries(paths)) {
    for (const method of NY_METHODS) {
      const op = (item ?? {})[method];
      if (op && typeof op === "object") rows.push({ path, method, op: op as Record<string, unknown> });
    }
  }
  const authRows = rows.filter((r) => /grant|auth|token|consent/i.test(`${r.path} ${String((r.op as Record<string, unknown>).operationId ?? "")}`));

  const allScopes = new Map<string, number>();
  for (const item of rows) {
    const security = ((item.op as Record<string, unknown>).security ?? []) as NySecurity[];
    for (const entry of security) {
      for (const scope of entry.scopes ?? []) {
        const key = String(scope);
        allScopes.set(key, (allScopes.get(key) ?? 0) + 1);
      }
    }
  }
  const implicitScopes = new Set<string>();
  for (const scheme of Object.values(schemes)) {
    for (const flow of Object.values(scheme.flows ?? {})) {
      for (const scope of Object.keys(flow.scopes ?? {})) implicitScopes.add(scope);
    }
  }

  const lines = [
    `Nylas grant and scope map, from ${NY_SPEC}`,
    `  document: ${spec.openapi ?? "version not reported"}, ${spec.info?.title ?? "untitled"} ${spec.info?.version ?? ""}`.trim(),
    `  servers: ${(spec.servers ?? []).map((s) => s.url).filter(Boolean).slice(0, 3).join(", ") || "none declared"}`,
    "",
    "  security scheme    type / scheme   what it is for",
  ];
  for (const [name, scheme] of Object.entries(schemes)) {
    lines.push(
      `  ${name.slice(0, 19).padEnd(20)}${String(`${scheme.type ?? "not reported"}${scheme.scheme ? ` / ${scheme.scheme}` : ""}`).slice(0, 15).padEnd(17)}${nyPlain(scheme.description, 70)}`,
    );
  }
  lines.push("");
  lines.push(
    implicitScopes.size
      ? `  the document documents ${implicitScopes.size} scope(s) in its flow definitions: ${[...implicitScopes].slice(0, 12).join(", ")}${implicitScopes.size > 12 ? ", ..." : ""}`
      : "  the flow definitions list no individual scopes",
  );
  lines.push("");
  lines.push(`  operationId                       method  path                                       scopes it asks for`);
  const scopeList = [...allScopes.entries()].sort((a, b) => b[1] - a[1]);
  const shown = authRows.length ? authRows : rows;
  for (const row of shown.slice(0, n)) {
    const security = ((row.op as Record<string, unknown>).security ?? []) as NySecurity[];
    const scopes = security.flatMap((entry) => entry.scopes ?? []).map(String);
    lines.push(
      `  ${String((row.op as Record<string, unknown>).operationId ?? "(none)").slice(0, 32).padEnd(33)}${row.method.toUpperCase().padEnd(7)}${row.path.slice(0, 42).padEnd(43)}${scopes.length ? scopes.join(" ") : "none declared"}`,
    );
  }
  if (shown.length > n) lines.push(`  ...and ${shown.length - n} more operation(s).`);
  lines.push("");
  if (scopeList.length) {
    lines.push(`  most demanded scope(s) across all ${rows.length} operations: ${scopeList.slice(0, 8).map(([scope, count]) => `${scope} (${count})`).join(", ")}`);
  }
  lines.push("  A scope that no operation asks for is one your integration does not need; one no operation declares is one you may be able to drop.");
  return lines.join("\n");
}

/** The shape of the message object Nylas returns, straight from the published schemas. */
export async function messageObjectAudit(args: { limit?: number }): Promise<string> {
  const n = Math.min(Math.max(Number(args?.limit ?? 14) || 14, 1), 40);
  const spec = await nySpecDoc("the message object");
  const schemas = spec.components?.schemas ?? {};
  const message = schemas.Message ?? Object.entries(schemas).find(([name, s]) => /message/i.test(name) && s.properties && Object.keys(s.properties).length > 5)?.[1];
  if (!message) throw new NylasError("The Nylas document has no Message schema to read.");
  const properties = message.properties ?? {};
  const names = Object.keys(properties);
  const required = new Set(message.required ?? []);
  const enums = names
    .map((name) => ({ name, values: properties[name]?.enum }))
    .filter((row): row is { name: string; values: unknown[] } => Array.isArray(row.values) && row.values.length > 0);
  const described = names.filter((name) => Boolean(properties[name]?.description));

  const lines = [
    `Nylas Message object, from the published schema in ${NY_SPEC}`,
    `  ${names.length} field(s), ${required.size} required, ${described.length} with a description`,
    `  ${enums.length} field(s) constrain their value with an enum`,
    "",
    "  field                          type       required  description",
  ];
  for (const name of names.slice(0, n)) {
    const field = properties[name] ?? {};
    const type = Array.isArray(field.type) ? field.type.join("|") : field.type ?? "not reported";
    lines.push(
      `  ${name.slice(0, 29).padEnd(30)}${String(type).slice(0, 10).padEnd(11)}${(required.has(name) ? "yes" : "no").padEnd(10)}${nyPlain(field.description, 46)}`,
    );
  }
  if (names.length > n) lines.push(`  ...and ${names.length - n} more field(s).`);
  if (enums.length) {
    lines.push("");
    lines.push("  field                          allowed values");
    for (const row of enums.slice(0, 10)) {
      const values = row.values.slice(0, 12).map((v) => String(v));
      lines.push(`  ${row.name.slice(0, 29).padEnd(30)}${values.join(", ")}${row.values.length > 12 ? `, +${row.values.length - 12} more` : ""}`);
    }
  }
  lines.push("");
  lines.push("  Field names here are what the API returns; a field you did not send is still present as null, so read it as absent rather than empty.");
  return lines.join("\n");
}
