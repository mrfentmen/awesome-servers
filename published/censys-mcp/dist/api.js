export class CensysError extends Error {
    constructor(message) {
        super(message);
        this.name = "CensysError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://search.censys.io/api/v2";
function headers() {
    const id = process.env.CENSYS_API_ID;
    const secret = process.env.CENSYS_API_SECRET;
    if (!id || !secret)
        throw new CensysError("Set CENSYS_API_ID and CENSYS_API_SECRET (free Censys tier).");
    const b64 = typeof Buffer !== "undefined" ? Buffer.from(`${id}:${secret}`).toString("base64") : btoa(`${id}:${secret}`);
    return { ...UA, Accept: "application/json", Authorization: "Basic " + b64 };
}
async function get(path) {
    let res;
    try {
        res = await fetch(BASE + path, { signal: AbortSignal.timeout(30000), headers: headers() });
    }
    catch (e) {
        throw new CensysError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new CensysError(`HTTP ${res.status}: ${body}`);
    }
    return res.text();
}
export function getHost(ip) {
    return get(`/hosts/${encodeURIComponent(ip)}`);
}
export function searchHosts(query, perPage) {
    const n = Math.min(Number(perPage ?? 10) || 10, 100);
    return get(`/hosts/search?q=${encodeURIComponent(query)}&per_page=${n}`);
}
async function getJson(path) {
    let res;
    try {
        res = await fetch(BASE + path, { signal: AbortSignal.timeout(30000), headers: headers() });
    }
    catch (e) {
        throw new CensysError(`Network error: ${errorMessage(e)}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new CensysError(`HTTP ${res.status}: ${body}`);
    }
    return (await res.json());
}
/**
 * GET /hosts/aggregate - buckets one field across every host matching a query.
 * Buckets come back as { key, count }, with total, total_omitted and
 * potential_deviation alongside.
 */
export async function hostAggregate(args) {
    const field = (args.field ?? "").trim();
    if (!/^[a-z_]+(\.[a-z_]+)*$/i.test(field))
        throw new CensysError("Field must be a Censys field path such as services.port or autonomous_system.asn.");
    const query = (args.query ?? "").trim();
    if (!query)
        throw new CensysError("Provide a Censys query, e.g. services.service_name: HTTP");
    const n = Math.max(1, Math.min(Math.floor(Number(args.buckets ?? 10) || 10), 50));
    const params = new URLSearchParams({ field, query, num_buckets: String(n) });
    const data = await getJson(`/hosts/aggregate?${params.toString()}`);
    const r = (data.result ?? data);
    const buckets = Array.isArray(r.buckets) ? r.buckets : [];
    if (!buckets.length)
        return `Censys returned no buckets for ${field} over "${query}".`;
    const total = Number(r.total ?? 0);
    const lines = [
        `Censys host aggregate: ${field}`,
        `Query: ${query}`,
        `${buckets.length} bucket(s) of ${total.toLocaleString()} host(s) matching`,
    ];
    if (typeof r.total_omitted === "number" && r.total_omitted > 0)
        lines.push(`${r.total_omitted.toLocaleString()} host(s) fell outside the requested buckets.`);
    if (typeof r.potential_deviation === "number")
        lines.push(`Censys reports a potential deviation of ${r.potential_deviation.toLocaleString()} on this total.`);
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
/** Search the certificate index: who issued what, for which names, and how long it is valid. */
export async function searchCertificates(args) {
    const q = (args.query ?? "").trim();
    if (!q)
        throw new CensysError("Provide a Censys certificate query, e.g. names: example.com");
    const n = Math.max(1, Math.min(Math.floor(Number(args.limit ?? 10) || 10), 50));
    const params = new URLSearchParams({ q, per_page: String(n) });
    const data = await getJson(`/certificates/search?${params.toString()}`);
    const r = (data.result ?? data);
    const hits = Array.isArray(r.hits) ? r.hits : [];
    if (!hits.length)
        return `Censys found no certificate matching "${q}".`;
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
        }
        else {
            lines.push("  valid: not reported");
        }
        const san = h.parsed?.extensions?.subject_alt_name;
        const dns = Array.isArray(san?.dns_names) ? san.dns_names : [];
        const ips = Array.isArray(san?.ip_addresses) ? san.ip_addresses : [];
        if (dns.length)
            lines.push(`  SAN dns: ${dns.slice(0, 8).join(", ")}${dns.length > 8 ? ` (+${dns.length - 8} more)` : ""}`);
        if (ips.length)
            lines.push(`  SAN ip: ${ips.slice(0, 6).join(", ")}${ips.length > 6 ? ` (+${ips.length - 6} more)` : ""}`);
        if (h.parsed?.ja3)
            lines.push(`  ja3: ${h.parsed.ja3}`);
        if (h.parsed?.ja4)
            lines.push(`  ja4: ${h.parsed.ja4}`);
        const nss = h.validation?.nss;
        if (nss)
            lines.push(`  NSS validation: valid ${nss.is_valid === true ? "yes" : "no"}, trusted path ${nss.has_trusted_path === true ? "yes" : "no"}, type ${nss.type ?? "not reported"}`);
        if (h.validation_level)
            lines.push(`  validation level: ${h.validation_level}`);
        if (h.revoked === true)
            lines.push("  REVOKED");
        lines.push("");
    }
    return lines.join("\n").trimEnd();
}
/** Which hosts present one certificate: the exposure surface behind a fingerprint. */
export async function certificateExposure(args) {
    const fp = (args.fingerprint ?? "").replace(/[^0-9a-fA-F]/g, "").toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(fp)) {
        throw new CensysError("Provide a full SHA-256 certificate fingerprint, 64 hex characters, colons allowed.");
    }
    const n = Math.max(1, Math.min(Math.floor(Number(args.limit ?? 20) || 20), 100));
    const cert = await getJson(`/certificates/${fp}`).then((d) => (d.result ?? d));
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
    const r = (data.result ?? data);
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
