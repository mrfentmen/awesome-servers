export class CensysError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CensysError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://search.censys.io/api/v2";

function headers(): Record<string, string> {
  const id = process.env.CENSYS_API_ID;
  const secret = process.env.CENSYS_API_SECRET;
  if (!id || !secret) throw new CensysError("Set CENSYS_API_ID and CENSYS_API_SECRET (free Censys tier).");
  const b64 = typeof Buffer !== "undefined" ? Buffer.from(`${id}:${secret}`).toString("base64") : btoa(`${id}:${secret}`);
  return { ...UA, Accept: "application/json", Authorization: "Basic " + b64 };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(BASE + path, { signal: AbortSignal.timeout(30000), headers: headers() });
  } catch (e) {
    throw new CensysError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new CensysError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

export function getHost(ip: string): Promise<string> {
  return get(`/hosts/${encodeURIComponent(ip)}`);
}

export function searchHosts(query: string, perPage?: string): Promise<string> {
  const n = Math.min(Number(perPage ?? 10) || 10, 100);
  return get(`/hosts/search?q=${encodeURIComponent(query)}&per_page=${n}`);
}

// ---- muxD tools:

interface CertHit {
  fingerprint_sha256?: string;
  names?: string[];
  labels?: string[];
  validation_level?: string | null;
  revoked?: boolean;
  added_at?: string;
  parsed?: {
    subject_dn?: string;
    issuer_dn?: string;
    serial_number_hex?: string;
    validity_period?: { not_before?: string; not_after?: string; length_seconds?: number };
    signature?: { signature_algorithm?: { name?: string } };
    extensions?: {
      key_usage?: Record<string, unknown>;
      extended_key_usage?: Record<string, unknown>;
      subject_alt_name?: { dns_names?: string[]; ip_addresses?: string[] };
    };
    ja3?: string | null;
    ja4?: string | null;
  };
  validation?: Record<string, { is_valid?: boolean; has_trusted_path?: boolean; type?: string }>;
}

async function getJson(path: string): Promise<Record<string, unknown>> {
  let res: Response;
  try {
    res = await fetch(BASE + path, { signal: AbortSignal.timeout(30000), headers: headers() });
  } catch (e) {
    throw new CensysError(`Network error: ${errorMessage(e)}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new CensysError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.json()) as Record<string, unknown>;
}

export interface AggregateArgs {
  field: string;
  query: string;
  buckets?: number;
}

/**
 * GET /hosts/aggregate - buckets one field across every host matching a query.
 * Buckets come back as { key, count }, with total, total_omitted and
 * potential_deviation alongside.
 */
export async function hostAggregate(args: AggregateArgs): Promise<string> {
  const field = (args.field ?? "").trim();
  if (!/^[a-z_]+(\.[a-z_]+)*$/i.test(field)) throw new CensysError("Field must be a Censys field path such as services.port or autonomous_system.asn.");
  const query = (args.query ?? "").trim();
  if (!query) throw new CensysError("Provide a Censys query, e.g. services.service_name: HTTP");
  const n = Math.max(1, Math.min(Math.floor(Number(args.buckets ?? 10) || 10), 50));
  const params = new URLSearchParams({ field, query, num_buckets: String(n) });
  const data = await getJson(`/hosts/aggregate?${params.toString()}`);
  const r = (data.result ?? data) as {
    total?: number; total_omitted?: number; potential_deviation?: number;
    buckets?: Array<{ key?: string; count?: number }>;
  };
  const buckets = Array.isArray(r.buckets) ? r.buckets : [];
  if (!buckets.length) return `Censys returned no buckets for ${field} over "${query}".`;
  const total = Number(r.total ?? 0);
  const lines = [
    `Censys host aggregate: ${field}`,
    `Query: ${query}`,
    `${buckets.length} bucket(s) of ${total.toLocaleString()} host(s) matching`,
  ];
  if (typeof r.total_omitted === "number" && r.total_omitted > 0) lines.push(`${r.total_omitted.toLocaleString()} host(s) fell outside the requested buckets.`);
  if (typeof r.potential_deviation === "number") lines.push(`Censys reports a potential deviation of ${r.potential_deviation.toLocaleString()} on this total.`);
  lines.push("");
  const max = Math.max(...buckets.map((b) => Number(b.count ?? 0)), 1);
  for (const b of buckets) {
    const count = Number(b.count ?? 0);
    const bar = "#".repeat(Math.max(1, Math.round((count / max) * 40)));
    const pct = total > 0 ? ` (${((count / total) * 100).toFixed(1)}%)` : "";
    lines.push(`  ${b.key ?? "(no value)"}: ${count.toLocaleString()}${pct} ${bar}`);
  }
  return lines.join("\n");
}

export interface CertSearchArgs {
  query: string;
  limit?: number;
}

/** Search the certificate index: who issued what, for which names, and how long it is valid. */
export async function searchCertificates(args: CertSearchArgs): Promise<string> {
  const q = (args.query ?? "").trim();
  if (!q) throw new CensysError("Provide a Censys certificate query, e.g. names: example.com");
  const n = Math.max(1, Math.min(Math.floor(Number(args.limit ?? 10) || 10), 50));
  const params = new URLSearchParams({ q, per_page: String(n) });
  const data = await getJson(`/certificates/search?${params.toString()}`);
  const r = (data.result ?? data) as { total?: number; hits?: CertHit[] };
  const hits = Array.isArray(r.hits) ? r.hits : [];
  if (!hits.length) return `Censys found no certificate matching "${q}".`;
  const now = Date.now();
  const lines = [`Censys certificates matching "${q}" — ${hits.length} of ${r.total ?? hits.length} total`, ""];
  for (const h of hits) {
    const vp = h.parsed?.validity_period ?? {};
    const daysLeft = vp.not_after ? Math.floor((new Date(vp.not_after).getTime() - now) / 86400000) : null;
    const names = Array.isArray(h.names) ? h.names : [];
    lines.push(`fingerprint ${h.fingerprint_sha256 ?? "not reported"}`);
    lines.push(`  subject: ${h.parsed?.subject_dn ?? "not reported"}`);
    lines.push(`  issuer: ${h.parsed?.issuer_dn ?? "not reported"}`);
    lines.push(`  signature: ${h.parsed?.signature?.signature_algorithm?.name ?? "not reported"}`);
    if (vp.not_before || vp.not_after) {
      lines.push(`  valid: ${String(vp.not_before ?? "?").slice(0, 10)} to ${String(vp.not_after ?? "?").slice(0, 10)}${daysLeft === null ? "" : daysLeft < 0 ? " (EXPIRED)" : ` (${daysLeft} day(s) left)`}`);
    } else {
      lines.push("  valid: not reported");
    }
    const san = h.parsed?.extensions?.subject_alt_name;
    const dns = Array.isArray(san?.dns_names) ? san.dns_names : [];
    const ips = Array.isArray(san?.ip_addresses) ? san.ip_addresses : [];
    if (dns.length) lines.push(`  SAN dns: ${dns.slice(0, 8).join(", ")}${dns.length > 8 ? ` (+${dns.length - 8} more)` : ""}`);
    if (ips.length) lines.push(`  SAN ip: ${ips.slice(0, 6).join(", ")}${ips.length > 6 ? ` (+${ips.length - 6} more)` : ""}`);
    if (h.parsed?.ja3) lines.push(`  ja3: ${h.parsed.ja3}`);
    if (h.parsed?.ja4) lines.push(`  ja4: ${h.parsed.ja4}`);
    const nss = h.validation?.nss;
    if (nss) lines.push(`  NSS validation: valid ${nss.is_valid === true ? "yes" : "no"}, trusted path ${nss.has_trusted_path === true ? "yes" : "no"}, type ${nss.type ?? "not reported"}`);
    if (h.validation_level) lines.push(`  validation level: ${h.validation_level}`);
    if (h.revoked === true) lines.push("  REVOKED");
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

export interface ExposureArgs {
  fingerprint: string;
  limit?: number;
}

/** Which hosts present one certificate: the exposure surface behind a fingerprint. */
export async function certificateExposure(args: ExposureArgs): Promise<string> {
  const fp = (args.fingerprint ?? "").replace(/[^0-9a-fA-F]/g, "").toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(fp)) {
    throw new CensysError("Provide a full SHA-256 certificate fingerprint, 64 hex characters, colons allowed.");
  }
  const n = Math.max(1, Math.min(Math.floor(Number(args.limit ?? 20) || 20), 100));
  const cert = await getJson(`/certificates/${fp}`).then((d) => (d.result ?? d) as CertHit);
  const names = Array.isArray(cert.names) ? cert.names : [];
  const vp = cert.parsed?.validity_period ?? {};
  const now = Date.now();
  const daysLeft = vp.not_after ? Math.floor((new Date(vp.not_after).getTime() - now) / 86400000) : null;

  const lines = [
    `Certificate ${fp}`,
    `Subject: ${cert.parsed?.subject_dn ?? "not reported"}`,
    `Issuer: ${cert.parsed?.issuer_dn ?? "not reported"}`,
    `Valid: ${String(vp.not_before ?? "?").slice(0, 10)} to ${String(vp.not_after ?? "?").slice(0, 10)}${daysLeft === null ? "" : daysLeft < 0 ? " (EXPIRED)" : ` (${daysLeft} day(s) left)`}`,
    names.length ? `Names (${names.length}): ${names.slice(0, 15).join(", ")}${names.length > 15 ? ` (+${names.length - 15} more)` : ""}` : "Names: not reported",
    "",
  ];

  const data = await getJson(`/certificates/${fp}/hosts?per_page=${n}`);
  const r = (data.result ?? data) as { total?: number; hits?: Array<{ ip?: string; services?: Array<{ port?: number; service_name?: string; transport_protocol?: string; observed_at?: string }> }> };
  const hits = Array.isArray(r.hits) ? r.hits : [];
  if (!hits.length) {
    lines.push("Censys lists no host presenting this certificate.");
    return lines.join("\n");
  }
  lines.push(`Hosts presenting it: ${hits.length} shown${typeof r.total === "number" && r.total > hits.length ? ` of ${r.total} total` : ""}`);
  for (const h of hits) {
    const svcs = Array.isArray(h.services) ? h.services : [];
    const ports = svcs
      .map((s) => `${s.service_name ?? "service not reported"} ${s.transport_protocol ?? "?"}/${s.port ?? "?"}`)
      .slice(0, 6);
    lines.push(`  ${h.ip ?? "ip not reported"} — ${ports.length ? ports.join(", ") : "no service detail"}`);
  }
  return lines.join("\n");
}
