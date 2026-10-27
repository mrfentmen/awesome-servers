/**
 * AbuseIPDB API v2 client. Needs ABUSEIPDB_API_KEY
 * (free at https://www.abuseipdb.com/account/api).
 * Docs: https://docs.abuseipdb.com/
 */
const BASE = "https://api.abuseipdb.com/api/v2";
export class AbuseIpDbError extends Error {
}
function headers() {
    const key = process.env.ABUSEIPDB_API_KEY;
    if (!key)
        throw new AbuseIpDbError("Set ABUSEIPDB_API_KEY first (free at abuseipdb.com/account/api).");
    return { "User-Agent": "abuseipdb-mcp/1.0", Accept: "application/json", Key: key };
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: headers(),
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 401 || res.status === 403)
        throw new AbuseIpDbError("AbuseIPDB refused (401/403). Check API key.");
    if (res.status === 422)
        throw new AbuseIpDbError("AbuseIPDB: bad request (check the IP).");
    if (res.status === 429)
        throw new AbuseIpDbError("AbuseIPDB quota hit (free tier is 1000/day). Wait and retry.");
    if (!res.ok)
        throw new AbuseIpDbError(`AbuseIPDB error ${res.status}`);
    return (await res.json());
}
export async function checkIp(ip, days = 90) {
    if (!ip.trim())
        throw new AbuseIpDbError("IP is empty.");
    const data = await getJson(`/check?ipAddress=${encodeURIComponent(ip.trim())}&maxAgeInDays=${Math.min(Math.max(days, 1), 365)}&verbose=true`);
    const d = data.data ?? {};
    const reports = Array.isArray(d.reports) ? d.reports : [];
    const lines = [
        `${String(d.ipAddress ?? ip.trim())} — confidence ${d.abuseConfidenceScore ?? "?"}%`,
        d.countryCode ? `Country: ${d.countryCode}${d.usageType ? ` (${d.usageType})` : ""}${d.isp ? ` via ${d.isp}` : ""}` : "",
        `Reports: ${d.totalReports ?? reports.length}`,
        ...reports.slice(0, 3).map((r) => `- ${String(r.reportedAt ?? "?").slice(0, 10)}: ${String(r.comment ?? "").slice(0, 120)}`),
    ].filter(Boolean);
    return lines.join("\n");
}
export async function blacklist(limit = 10) {
    const data = await getJson(`/blacklist?confidenceMinimum=90&limit=${Math.min(Math.max(limit, 1), 100)}`);
    const rows = Array.isArray(data.data) ? data.data : [];
    return rows.slice(0, limit).map((r) => `${String(r.ipAddress ?? "?")} (${r.abuseConfidenceScore ?? "?"}%${r.countryCode ? `, ${r.countryCode}` : ""})`);
}
export async function checkBlock(network, days = 90) {
    if (!network.trim())
        throw new AbuseIpDbError("Network is empty.");
    const data = await getJson(`/check-block?network=${encodeURIComponent(network.trim())}&maxAgeInDays=${Math.min(Math.max(days, 1), 365)}`);
    const d = data.data ?? {};
    const hosts = Array.isArray(d.reportedAddress) ? d.reportedAddress : [];
    return `${network.trim()} — ${hosts.length} reported hosts\n` + hosts.slice(0, 10).map((h) => `${String(h.ipAddress ?? "?")} (${h.abuseConfidenceScore ?? "?"}%, ${h.countryCode ?? "?"})`).join("\n");
}
export async function recentReports(ip, limit = 5) {
    if (!ip.trim())
        throw new AbuseIpDbError("IP is empty.");
    const data = await getJson(`/reports?ipAddress=${encodeURIComponent(ip.trim())}&page=1&perPage=${Math.min(Math.max(limit, 1), 100)}`);
    const d = data.data ?? {};
    const reports = Array.isArray(d.results) ? d.results : [];
    return reports.slice(0, limit).map((r) => `${String(r.reportedAt ?? "?").slice(0, 10)} [${(r.categories ?? []).join(",")}] ${String(r.comment ?? "").slice(0, 140)}`);
}
