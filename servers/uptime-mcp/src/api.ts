import * as tls from "node:tls"

const UA = "mrfentmen-uptime-mcp/1.0 (https://github.com/mrfentmen)"
export class UptimeError extends Error {}

export async function check(args: { url?: string }): Promise<string> {
  const raw = (args.url ?? "").trim()
  if (!raw) throw new UptimeError("Provide a URL like https://example.com")
  const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new UptimeError("That URL is not valid")
  }
  const started = Date.now()
  let res: Response
  try {
    res = await fetch(parsed.toString(), {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(12000),
    })
  } catch (e) {
    return `DOWN | ${url}\n  ${e instanceof Error ? e.message : String(e)}`
  }
  const latency = Date.now() - started
  const lines = [
    `URL: ${url}`,
    `Status: ${res.status} ${res.statusText}`,
    `Latency: ${latency} ms`,
    `Final URL: ${res.url ?? url}`,
    `Content type: ${res.headers.get("content-type") ?? "n/a"}`,
  ]
  if (res.ok) lines.push(`State: UP`)
  else lines.push(`State: WARNING (non 2xx status)`)
  return lines.join("\n")
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export async function cert(args: { host?: string }): Promise<string> {
  const host = (args.host ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0]
  if (!host) throw new UptimeError("Provide a hostname like example.com")
  const cert = await new Promise<tls.PeerCertificate | null>((resolve) => {
    const socket = tls.connect({
      host,
      port: 443,
      servername: host,
      timeout: 12000,
      rejectUnauthorized: false,
    })
    socket.on("secureConnect", () => {
      try {
        const c = socket.getPeerCertificate()
        resolve(c && c.valid_to ? c : null)
      } catch {
        resolve(null)
      } finally {
        socket.end()
      }
    })
    socket.on("error", () => {
      resolve(null)
      socket.destroy()
    })
    socket.on("timeout", () => {
      resolve(null)
      socket.destroy()
    })
  })
  if (!cert) throw new UptimeError(`Could not get a TLS certificate for ${host}`)
  const validTo = new Date(cert.valid_to)
  const validFrom = new Date(cert.valid_from)
  const daysLeft = Math.floor((validTo.getTime() - Date.now()) / 86400000)
  const state = daysLeft < 0 ? "EXPIRED" : daysLeft < 30 ? "EXPIRING SOON" : "OK"
  const lines = [
    `Host: ${host}`,
    `Subject: ${cert.subject?.CN ?? "n/a"}`,
    `Issuer: ${cert.issuer?.O ?? cert.issuer?.CN ?? "n/a"}`,
    `Valid from: ${fmtDate(validFrom)}`,
    `Valid to: ${fmtDate(validTo)}`,
    `Days left: ${daysLeft}`,
    `State: ${state}`,
  ]
  return lines.join("\n")
}

// ---- muxB tools:

const DOH = 'https://dns.google/resolve';
const DNS_TYPES: Record<string, number> = {
  A: 1, NS: 2, CNAME: 5, SOA: 6, PTR: 12, MX: 15, TXT: 16, AAAA: 28, SRV: 33, CAA: 257,
}

export interface DnsRecordsArgs {
  host?: string;
  type?: string;
}

export async function dnsRecords(args: DnsRecordsArgs): Promise<string> {
  const host = (args.host ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0]
  if (!host) throw new UptimeError("Provide a hostname like example.com")
  const wanted = (args.type ?? "A").trim().toUpperCase()
  const code = DNS_TYPES[wanted]
  if (!code) throw new UptimeError(`Unsupported record type ${wanted}. Try one of ${Object.keys(DNS_TYPES).join(", ")}`)
  const res = await fetch(`${DOH}?name=${encodeURIComponent(host)}&type=${code}`, {
    headers: { "User-Agent": UA, Accept: "application/dns-json" },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new UptimeError(`Google DNS returned ${res.status}`)
  const d = (await res.json()) as { Status?: number; Answer?: Array<{ name?: string; type?: number; TTL?: number; data?: string }> }
  const answers = Array.isArray(d.Answer) ? d.Answer : []
  const head = `DNS ${wanted} records for ${host} (Google DoH, resolver status ${d.Status ?? "n/a"}):\n`
  if (!answers.length) return head + (d.Status === 0 ? "No records in the answer section." : "Resolver returned no answer.")
  return head + answers.slice(0, 20).map((a, i) => `${i + 1}. ${a.data ?? "not reported"} (ttl ${a.TTL ?? "n/a"}s)`).join("\n")
}

const STATUS_PAGES: Record<string, { name: string; url: string }> = {
  github: { name: "GitHub", url: "https://www.githubstatus.com/api/v2" },
  cloudflare: { name: "Cloudflare", url: "https://www.cloudflarestatus.com/api/v2" },
  reddit: { name: "Reddit", url: "https://www.redditstatus.com/api/v2" },
}

export interface ServiceStatusArgs {
  service?: string;
  limit?: number;
}

export async function serviceStatus(args: ServiceStatusArgs): Promise<string> {
  const key = (args.service ?? "github").trim().toLowerCase()
  const page = STATUS_PAGES[key]
  if (!page) throw new UptimeError(`Unknown service "${key}". Try one of ${Object.keys(STATUS_PAGES).join(", ")}`)
  const limit = Math.max(1, Math.min(args.limit ?? 10, 40))
  const res = await fetch(`${page.url}/summary.json`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new UptimeError(`Status page for ${page.name} returned ${res.status}`)
  const d = (await res.json()) as {
    page?: { updated_at?: string; status?: { indicator?: string; description?: string } }
    components?: Array<{ name?: string; status?: string; updated_at?: string }>
    incidents?: Array<{ name?: string; status?: string; impact?: string; created_at?: string; shortlink?: string }>
  }
  const components = Array.isArray(d.components) ? d.components : []
  const incidents = Array.isArray(d.incidents) ? d.incidents : []
  const broken = components.filter((c) => c.status && c.status !== "operational")
  const lines = [
    `${page.name} status: ${d.page?.status?.description ?? d.page?.status?.indicator ?? "not reported"}`,
    `Page updated: ${d.page?.updated_at ?? "not reported"}`,
    `Components: ${components.length} total, ${broken.length} not operational`,
  ]
  for (const c of broken.slice(0, limit)) lines.push(`  - ${c.name ?? "not reported"}: ${c.status ?? "not reported"} (${c.updated_at ?? "no timestamp"})`)
  lines.push(`Open incidents: ${incidents.length}`)
  for (const i of incidents.slice(0, limit)) {
    lines.push(`  - ${i.name ?? "not reported"} [${i.status ?? "not reported"} / ${i.impact ?? "impact not reported"}] ${i.shortlink ?? ""}`.trimEnd())
  }
  return lines.join("\n")
}
