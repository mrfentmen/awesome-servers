/**
 * VirusTotal API v3 client. Needs VIRUSTOTAL_API_KEY
 * (free at https://www.virustotal.com/gui/my-apikey).
 * Docs: https://docs.virustotal.com/reference/overview
 */
const BASE = "https://www.virustotal.com/api/v3"

export class VirusTotalError extends Error {}

function headers(): Record<string, string> {
  const key = process.env.VIRUSTOTAL_API_KEY
  if (!key) throw new VirusTotalError("Set VIRUSTOTAL_API_KEY first (free at virustotal.com/gui/my-apikey).")
  return { "User-Agent": "virustotal-mcp/1.0", Accept: "application/json", "x-apikey": key }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: headers(),
    signal: AbortSignal.timeout(25000),
  })
  if (res.status === 401 || res.status === 403) throw new VirusTotalError("VirusTotal refused (401/403). Check API key.")
  if (res.status === 404) throw new VirusTotalError("Not found in VirusTotal.")
  if (res.status === 429) throw new VirusTotalError("VirusTotal quota hit (free tier is 500/day). Wait and retry.")
  if (!res.ok) throw new VirusTotalError(`VirusTotal error ${res.status}`)
  return (await res.json()) as T
}

export interface Verdict {
  target: string
  malicious: number
  suspicious: number
  harmless: number
  undetected: number
  reputation?: number
}

function verdictOf(target: string, attrs: Raw): Verdict {
  const stats: Raw = attrs.last_analysis_stats ?? {}
  return {
    target,
    malicious: Number(stats.malicious ?? 0),
    suspicious: Number(stats.suspicious ?? 0),
    harmless: Number(stats.harmless ?? 0),
    undetected: Number(stats.undetected ?? 0),
    reputation: typeof attrs.reputation === "number" ? attrs.reputation : undefined,
  }
}

export async function fileReport(hash: string): Promise<Verdict> {
  if (!/^[0-9a-fA-F]{32,128}$/.test(hash.trim())) throw new VirusTotalError(`Not a hash: "${hash}". Use MD5/SHA1/SHA256.`)
  const data = await getJson<Raw>(`/files/${encodeURIComponent(hash.trim().toLowerCase())}`)
  return verdictOf(hash.trim().toLowerCase(), (data.data?.attributes ?? {}) as Raw)
}

export async function urlReport(url: string): Promise<Verdict> {
  if (!/^https?:\/\//i.test(url.trim())) throw new VirusTotalError(`Not a URL: "${url}".`)
  const id = Buffer.from(url.trim()).toString("base64url")
  const data = await getJson<Raw>(`/urls/${id}`)
  return verdictOf(url.trim(), (data.data?.attributes ?? {}) as Raw)
}

export async function domainReport(domain: string): Promise<Verdict> {
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain.trim())) throw new VirusTotalError(`Not a domain: "${domain}".`)
  const data = await getJson<Raw>(`/domains/${encodeURIComponent(domain.trim().toLowerCase())}`)
  return verdictOf(domain.trim().toLowerCase(), (data.data?.attributes ?? {}) as Raw)
}

export async function ipReport(ip: string): Promise<Verdict> {
  if (!/^[0-9a-fA-F.:]+$/.test(ip.trim())) throw new VirusTotalError(`Not an IP: "${ip}".`)
  const data = await getJson<Raw>(`/ip_addresses/${encodeURIComponent(ip.trim())}`)
  return verdictOf(ip.trim(), (data.data?.attributes ?? {}) as Raw)
}

export function formatVerdict(v: Verdict): string {
  const verdict = v.malicious > 0 ? "MALICIOUS" : v.suspicious > 0 ? "SUSPICIOUS" : "CLEAN";
  return [
    `${v.target} — ${verdict}`,
    `Engines: ${v.malicious} malicious / ${v.suspicious} suspicious / ${v.harmless} harmless / ${v.undetected} undetected`,
    v.reputation !== undefined ? `Community reputation: ${v.reputation}` : "",
  ].filter(Boolean).join("\n")
}
