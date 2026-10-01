export class AckeeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AckeeError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new AckeeError(`Set the ${name} environment variable.`)
  return v
}

async function authHeaders(): Promise<Record<string, string>> {
  return { Authorization: "Bearer " + envStrict("ACKEE_API_TOKEN") };
}
async function gql(query: string): Promise<unknown> {
  const base = envStrict("ACKEE_BASE_URL").replace(/\/$/, "");
  const data = await req(`${base}/api`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query }) });
  const body = data as { data?: unknown; errors?: Array<{ message?: string }> };
  if (body.errors && body.errors.length > 0) throw new AckeeError(body.errors.map((e) => e.message ?? "GraphQL error").join("; "));
  return body.data;
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(url: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(url, { headers: { ...UA, ...(await authHeaders()), ...(init.headers ?? {}) }, ...init })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new AckeeError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function listDomains(): Promise<string> {
  const data = await gql("{ domains { id title } }");
  return pretty(data);
}

export async function getDomain(domainId: string): Promise<string> {
  const q = `query { domain(id: "${domainId}") { id title facts { activeVisitors } statistics { views(interval: YEARLY, type: UNIQUE) { id count } } } }`;
  const data = await gql(q);
  return pretty(data);
}

export async function getTopBrowsers(domainId: string): Promise<string> {
  const q = `query { domain(id: "${domainId}") { statistics { browsers(sorting: TOP, type: WITH_VERSION, range: LAST_6_MONTHS, limit: 10) { id count } } } }`;
  const data = await gql(q);
  return pretty(data);
}

// ---- The iTunes/App Store premium tools moved to the licence gateway
// (src/gateway.ts); what remains here is the free Ackee GraphQL client.
