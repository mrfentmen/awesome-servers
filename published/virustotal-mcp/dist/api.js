/**
 * VirusTotal API v3 client. Needs VIRUSTOTAL_API_KEY
 * (free at https://www.virustotal.com/gui/my-apikey).
 * Docs: https://docs.virustotal.com/reference/overview
 */
const BASE = "https://www.virustotal.com/api/v3";
export class VirusTotalError extends Error {
}
function headers() {
    const key = process.env.VIRUSTOTAL_API_KEY;
    if (!key)
        throw new VirusTotalError("Set VIRUSTOTAL_API_KEY first (free at virustotal.com/gui/my-apikey).");
    return { "User-Agent": "virustotal-mcp/1.0", Accept: "application/json", "x-apikey": key };
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: headers(),
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 401 || res.status === 403)
        throw new VirusTotalError("VirusTotal refused (401/403). Check API key.");
    if (res.status === 404)
        throw new VirusTotalError("Not found in VirusTotal.");
    if (res.status === 429)
        throw new VirusTotalError("VirusTotal quota hit (free tier is 500/day). Wait and retry.");
    if (!res.ok)
        throw new VirusTotalError(`VirusTotal error ${res.status}`);
    return (await res.json());
}
function verdictOf(target, attrs) {
    const stats = attrs.last_analysis_stats ?? {};
    return {
        target,
        malicious: Number(stats.malicious ?? 0),
        suspicious: Number(stats.suspicious ?? 0),
        harmless: Number(stats.harmless ?? 0),
        undetected: Number(stats.undetected ?? 0),
        reputation: typeof attrs.reputation === "number" ? attrs.reputation : undefined,
    };
}
export async function fileReport(hash) {
    if (!/^[0-9a-fA-F]{32,128}$/.test(hash.trim()))
        throw new VirusTotalError(`Not a hash: "${hash}". Use MD5/SHA1/SHA256.`);
    const data = await getJson(`/files/${encodeURIComponent(hash.trim().toLowerCase())}`);
    return verdictOf(hash.trim().toLowerCase(), (data.data?.attributes ?? {}));
}
export async function urlReport(url) {
    if (!/^https?:\/\//i.test(url.trim()))
        throw new VirusTotalError(`Not a URL: "${url}".`);
    const id = Buffer.from(url.trim()).toString("base64url");
    const data = await getJson(`/urls/${id}`);
    return verdictOf(url.trim(), (data.data?.attributes ?? {}));
}
export async function domainReport(domain) {
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain.trim()))
        throw new VirusTotalError(`Not a domain: "${domain}".`);
    const data = await getJson(`/domains/${encodeURIComponent(domain.trim().toLowerCase())}`);
    return verdictOf(domain.trim().toLowerCase(), (data.data?.attributes ?? {}));
}
export async function ipReport(ip) {
    if (!/^[0-9a-fA-F.:]+$/.test(ip.trim()))
        throw new VirusTotalError(`Not an IP: "${ip}".`);
    const data = await getJson(`/ip_addresses/${encodeURIComponent(ip.trim())}`);
    return verdictOf(ip.trim(), (data.data?.attributes ?? {}));
}
export function formatVerdict(v) {
    const verdict = v.malicious > 0 ? "MALICIOUS" : v.suspicious > 0 ? "SUSPICIOUS" : "CLEAN";
    return [
        `${v.target} — ${verdict}`,
        `Engines: ${v.malicious} malicious / ${v.suspicious} suspicious / ${v.harmless} harmless / ${v.undetected} undetected`,
        v.reputation !== undefined ? `Community reputation: ${v.reputation}` : "",
    ].filter(Boolean).join("\n");
}
