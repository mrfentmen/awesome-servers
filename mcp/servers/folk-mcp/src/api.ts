export class FolkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "FolkError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://api.folk.app/v1";

function headers(): Record<string, string> {
  const k = process.env.FOLK_API_KEY;
  if (!k) throw new FolkError("Set FOLK_API_KEY (free Folk tier).");
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(BASE + path, { signal: AbortSignal.timeout(30000), headers: headers() });
  } catch (e) {
    throw new FolkError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new FolkError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

export function listPeople(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 100);
  return get(`/people?limit=${n}`);
}

export function getPerson(personId: string): Promise<string> {
  return get(`/people/${encodeURIComponent(personId)}`);
}

export function listGroups(): Promise<string> {
  return get("/groups");
}

// ---- muxG tools:
const DOH_BASE = "https://dns.google/resolve"
const RDAP_BASE = "https://rdap.org/domain"

type FolkRaw = Record<string, unknown>;

interface DohAnswer {
  name?: string;
  type?: number;
  TTL?: number;
  data?: string;
}

interface DohResponse {
  Status?: number;
  Answer?: DohAnswer[];
  Comment?: string;
}

interface RdapEvent {
  eventAction?: string;
  eventDate?: string;
}

interface RdapEntity {
  roles?: string[];
  vcardArray?: unknown;
}

interface RdapResponse {
  ldhName?: string;
  handle?: string;
  status?: string[];
  events?: RdapEvent[];
  nameservers?: { ldhName?: string }[];
  entities?: RdapEntity[];
  notices?: { title?: string; description?: string[] }[];
}

async function folkFetchJson<T>(url: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { ...UA, Accept: "application/dns-json, application/rdap+json, application/json" },
      signal: AbortSignal.timeout(20000),
    });
  } catch (e) {
    throw new FolkError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) throw new FolkError(`HTTP ${res.status} from ${url.split("?")[0]}`);
  const body = await res.text();
  if (!body.trim()) throw new FolkError("Upstream returned an empty body.");
  return JSON.parse(body) as T;
}

function domainOf(email: string): string {
  const value = (email ?? "").trim().toLowerCase();
  const at = value.lastIndexOf("@");
  if (at < 1 || at === value.length - 1) throw new FolkError(`"${email}" is not an email address.`);
  const domain = value.slice(at + 1);
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) throw new FolkError(`"${domain}" does not look like a domain name.`);
  return domain;
}

const TYPE_NAMES: Record<number, string> = { 1: "A", 2: "NS", 5: "CNAME", 15: "MX", 16: "TXT", 28: "AAAA" };

async function resolveType(name: string, type: number): Promise<DohAnswer[]> {
  const data = await folkFetchJson<DohResponse>(`${DOH_BASE}?name=${encodeURIComponent(name)}&type=${type}`);
  if (typeof data?.Status === "number" && data.Status !== 0) {
    const reasons: Record<number, string> = { 2: "server failure", 3: "name does not exist", 5: "refused", 9: "not authorised" };
    throw new FolkError(`${name}: ${reasons[data.Status] ?? `DNS status ${data.Status}`}`)
  }
  return Array.isArray(data?.Answer) ? data.Answer : [];
}

export interface EmailDomainDnsArgs {
  email: string;
}

export async function emailDomainDns(args: EmailDomainDnsArgs): Promise<string> {
  const domain = domainOf(args.email);
  const lines = [`Mail and web DNS for ${domain} (the domain of ${(args.email ?? "").trim()}), from Google Public DNS over HTTPS.`];

  const mx = await resolveType(domain, 15);
  lines.push("");
  if (!mx.length) {
    lines.push("MX: no mail exchanger published, so this domain cannot receive mail.");
  } else {
    const hosts = mx
      .map((a) => (a.data ?? "").split(/\s+/).filter(Boolean))
      .filter((parts) => parts.length >= 2)
      .map((parts) => ({ priority: Number(parts[0]), host: parts[1].replace(/\.$/, "") }))
      .sort((a, b) => a.priority - b.priority);
    lines.push(`MX: ${hosts.length} exchanger${hosts.length === 1 ? "" : "s"}, lowest priority first.`);
    for (const host of hosts.slice(0, 6)) lines.push(`  ${host.priority} ${host.host}`)
    if (hosts.length > 6) lines.push(`  ...and ${hosts.length - 6} more.`)
  }

  const spf = (await resolveType(domain, 16)).filter((a) => (a.data ?? "").toLowerCase().startsWith("v=spf1"));
  lines.push("");
  lines.push("SPF: " + (spf.length ? spf[0].data!.slice(0, 300) : "no v=spf1 record published"));

  let dmarc = "no _dmarc TXT record published";
  try {
    const records = await resolveType(`_dmarc.${domain}`, 16);
    if (records.length) dmarc = (records[0].data ?? "").slice(0, 300);
  } catch (e) {
    dmarc = `not published (${errorMessage(e)})`;
  }
  lines.push("DMARC: " + dmarc);

  const addresses = await resolveType(domain, 28);
  if (addresses.length) {
    lines.push("");
    lines.push(`AAAA: ${addresses.slice(0, 4).map((a) => a.data).join(", ")}${addresses.length > 4 ? ` ...and ${addresses.length - 4} more` : ""}`);
  }

  const nameServers = await resolveType(domain, 2);
  if (nameServers.length) {
    lines.push("");
    lines.push(`NS: ${nameServers.slice(0, 6).map((a) => (a.data ?? "").replace(/\.$/, "")).join(", ")}`);
  }
  return lines.join("\n");
}

function vcardField(entity: RdapEntity, field: string): string | null {
  const vcard = entity.vcardArray;
  if (!Array.isArray(vcard) || !Array.isArray(vcard[1])) return null;
  for (const item of vcard[1] as unknown[]) {
    if (Array.isArray(item) && item[0] === field && typeof item[3] === "string") return item[3];
  }
  return null;
}

export interface DomainRegistrationArgs {
  domain: string;
}

export async function domainRegistration(args: DomainRegistrationArgs): Promise<string> {
  const wanted = (args.domain ?? "").trim().toLowerCase().replace(/\.$/, "");
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(wanted)) {
    throw new FolkError(`"${args.domain}" does not look like a domain name.`);
  }
  let domain = wanted;
  const data = await folkFetchJson<RdapResponse>(`${RDAP_BASE}/${encodeURIComponent(domain)}`);
  if (!data || typeof data !== "object") throw new FolkError(`No RDAP record for ${domain}.`);
  if (data.ldhName) domain = String(data.ldhName).toLowerCase();

  const lines = [`RDAP registration record for ${domain}`];
  const registrar = (data.entities ?? []).find((e) => (e.roles ?? []).includes("registrar"));
  lines.push(`Registrar: ${(registrar && vcardField(registrar, "fn")) || "not reported"}`);

  const events = new Map<string, string>();
  for (const event of data.events ?? []) {
    if (event.eventAction && !events.has(event.eventAction)) events.set(event.eventAction, event.eventDate ?? "date not reported");
  }
  lines.push(`Registered: ${events.get("registration") ?? "not reported"}`);
  lines.push(`Expires: ${events.get("expiration") ?? "not reported"}`);
  lines.push(`Last changed: ${events.get("last changed") ?? "not reported"}`);

  const status = data.status ?? [];
  lines.push("");
  lines.push(`Status (${status.length}): ${status.length ? status.slice(0, 8).join(", ") : "not reported"}`);
  if (status.length > 8) lines.push(`  ...and ${status.length - 8} more.`)

  const nameservers = (data.nameservers ?? []).map((n) => n.ldhName).filter((n): n is string => typeof n === "string");
  lines.push("");
  lines.push(`Nameservers (${nameservers.length}): ${nameservers.length ? nameservers.slice(0, 8).join(", ") : "not reported"}`);
  if (nameservers.length > 8) lines.push(`  ...and ${nameservers.length - 8} more.`)
  return lines.join("\n");
}
