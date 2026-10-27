import { connect } from "node:tls"
import type { TLSSocket } from "node:tls"

const UA = "mrfentmen-ohdear-mcp/1.0"
const DOH = "https://dns.google/resolve"

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

/** Accepts "example.com", "https://example.com/x" or "example.com:8080". */
export function normalizeTarget(input: string): URL {
  const raw = (input ?? "").trim()
  if (!raw) throw new Error("Provide a URL or hostname, for example https://example.com.")
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  let url: URL
  try {
    url = new URL(withScheme)
  } catch {
    throw new Error(`"${input}" is not a valid URL or hostname.`)
  }
  if (!url.hostname.includes(".")) throw new Error(`"${input}" does not look like a public hostname.`)
  return url
}

export interface HttpHop {
  url: string
  status: number
  location: string | null
}

export interface HttpResult {
  ok: boolean
  status: number
  statusText: string
  finalUrl: string
  ms: number
  bytes: number
  contentType: string
  server: string | null
  headers: Record<string, string>
  hops: HttpHop[]
  bodySnippet: string
}

const HEADER_KEYS = [
  "content-type",
  "server",
  "strict-transport-security",
  "content-security-policy",
  "x-frame-options",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
  "cache-control",
  "x-powered-by",
]

/**
 * Fetches a URL and follows redirects by hand so the caller can see every hop.
 * This is exactly the check an uptime monitor runs, done live.
 */
export async function request(target: string, timeoutMs = 15000): Promise<HttpResult> {
  const start = Date.now()
  let url = normalizeTarget(target)
  const hops: HttpHop[] = []
  let last: Response | null = null
  let body = ""

  for (let i = 0; i < 6; i += 1) {
    const res = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: { "User-Agent": UA, Accept: "*/*" },
      signal: AbortSignal.timeout(timeoutMs),
    })
    last = res
    const location = res.headers.get("location")
    hops.push({ url: url.toString(), status: res.status, location })
    if (res.status >= 300 && res.status < 400 && location) {
      url = new URL(location, url)
      continue
    }
    body = (await res.text()).slice(0, 4000)
    break
  }

  if (!last) throw new Error("No response received.")
  const headers: Record<string, string> = {}
  for (const key of HEADER_KEYS) {
    const value = last.headers.get(key)
    if (value) headers[key] = value.slice(0, 400)
  }

  return {
    ok: last.status >= 200 && last.status < 400,
    status: last.status,
    statusText: last.statusText,
    finalUrl: url.toString(),
    ms: Date.now() - start,
    bytes: Buffer.byteLength(body),
    contentType: last.headers.get("content-type") ?? "",
    server: last.headers.get("server"),
    headers,
    hops,
    bodySnippet: body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200),
  }
}

export async function checkUrl(args: { url: string }): Promise<string> {
  const r = await request(args.url)
  const lines = [
    `${r.ok ? "UP" : "DOWN"} — ${r.finalUrl}`,
    `HTTP ${r.status} ${r.statusText} in ${r.ms} ms`,
    `Content type: ${r.contentType || "unknown"} | Server: ${r.server ?? "not disclosed"}`,
    `Body read: ${r.bytes} byte(s)`,
  ]
  if (r.hops.length > 1) {
    lines.push("", `Redirect chain (${r.hops.length} hop(s)):`)
    r.hops.forEach((hop, i) => {
      const arrow = hop.location ? ` -> ${hop.location}` : ""
      lines.push(`  ${i + 1}. ${hop.status} ${hop.url}${arrow}`)
    })
  }
  if (r.bodySnippet) lines.push("", `First text: ${r.bodySnippet}`)
  return lines.join("\n")
}

export async function checkMany(args: { urls: string[] }): Promise<string> {
  const urls = (args.urls ?? []).map((u) => String(u).trim()).filter(Boolean).slice(0, 10)
  if (!urls.length) return "Provide up to 10 URLs to check."
  const rows: string[] = []
  let up = 0
  // Sequential on purpose: a monitor should not hammer a host from one IP at once.
  for (const url of urls) {
    try {
      const r = await request(url, 12000)
      if (r.ok) up += 1
      rows.push(`${r.ok ? "UP  " : "DOWN"} ${r.status} ${String(r.ms).padStart(6)} ms  ${url}${r.finalUrl !== url ? ` -> ${r.finalUrl}` : ""}`)
    } catch (e) {
      rows.push(`DOWN --- ${url}  (${errorMessage(e)})`)
    }
  }
  return `Checked ${urls.length} URL(s): ${up} up, ${urls.length - up} down.\n\n${rows.join("\n")}`
}

export interface CertInfo {
  subject: Record<string, string>
  issuer: Record<string, string>
  validFrom: string
  validTo: string
  daysRemaining: number
  altNames: string[]
  authorized: boolean
  authorizationError: string | null
  protocol: string
}

/** Reads the live certificate off the host's own TLS handshake. */
export async function fetchCertificate(hostname: string, port = 443): Promise<CertInfo> {
  return new Promise<CertInfo>((resolve, reject) => {
    const socket: TLSSocket = connect(
      { host: hostname, port, servername: hostname, rejectUnauthorized: false, timeout: 15000 },
      () => {
        const cert = socket.getPeerCertificate()
        if (!cert || !cert.valid_to) {
          socket.destroy()
          reject(new Error(`No certificate returned by ${hostname}:${port}.`))
          return
        }
        const validTo = new Date(cert.valid_to)
        const info: CertInfo = {
          subject: (cert.subject ?? {}) as Record<string, string>,
          issuer: (cert.issuer ?? {}) as Record<string, string>,
          validFrom: new Date(cert.valid_from).toISOString(),
          validTo: validTo.toISOString(),
          daysRemaining: Math.floor((validTo.getTime() - Date.now()) / 86400000),
          altNames: String(cert.subjectaltname ?? "")
            .split(",")
            .map((n) => n.trim().replace(/^DNS:/, ""))
            .filter(Boolean)
            .slice(0, 50),
          authorized: socket.authorized,
          authorizationError: socket.authorized ? null : String(socket.authorizationError ?? "unknown"),
          protocol: socket.getProtocol() ?? "unknown",
        }
        socket.destroy()
        resolve(info)
      },
    )
    socket.on("error", (e) => reject(new Error(`TLS connection to ${hostname}:${port} failed: ${e.message}`)))
    socket.on("timeout", () => {
      socket.destroy()
      reject(new Error(`TLS connection to ${hostname}:${port} timed out.`))
    })
  })
}

export async function sslCertificate(args: { host: string }): Promise<string> {
  const host = normalizeTarget(args.host).hostname
  const c = await fetchCertificate(host)
  const expiry = c.daysRemaining < 0
    ? `EXPIRED ${Math.abs(c.daysRemaining)} day(s) ago`
    : c.daysRemaining < 14
      ? `EXPIRES IN ${c.daysRemaining} day(s) — renew now`
      : `valid for ${c.daysRemaining} more day(s)`
  return [
    `Certificate for ${host}`,
    `Status: ${expiry}`,
    `Subject: ${c.subject.CN ?? c.subject.O ?? "unknown"}`,
    `Issuer: ${c.issuer.O ?? c.issuer.CN ?? "unknown"}`,
    `Valid from: ${c.validFrom}`,
    `Valid to:   ${c.validTo}`,
    `Protocol: ${c.protocol}`,
    `Trusted chain: ${c.authorized ? "yes" : `no (${c.authorizationError})`}`,
    c.altNames.length ? `Covers ${c.altNames.length} name(s): ${c.altNames.slice(0, 12).join(", ")}` : "No subject alternative names.",
  ].join("\n")
}

const RECORD_TYPES = ["A", "AAAA", "NS", "MX", "TXT", "CAA"] as const
const TYPE_NAMES: Record<number, string> = {
  1: "A", 2: "NS", 5: "CNAME", 6: "SOA", 15: "MX", 16: "TXT", 28: "AAAA", 257: "CAA",
}

interface DohAnswer { name?: string; type?: number; TTL?: number; data?: string }
interface DohResponse { Status?: number; Answer?: DohAnswer[] }

async function dnsQuery(name: string, type: string): Promise<DohResponse> {
  const res = await fetch(`${DOH}?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`, {
    headers: { "User-Agent": UA, Accept: "application/dns-json" },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`DNS-over-HTTPS returned ${res.status}`)
  return (await res.json()) as DohResponse
}

const answerLines = (d: DohResponse): string[] =>
  (d.Answer ?? []).map((row) => {
    const kind = TYPE_NAMES[row.type ?? 0] ?? `TYPE${row.type ?? "?"}`
    return `${kind} ${String(row.data ?? "").trim()}`
  })

export async function dnsHealth(args: { domain: string }): Promise<string> {
  const domain = normalizeTarget(args.domain).hostname
  const results = await Promise.allSettled(RECORD_TYPES.map((type) => dnsQuery(domain, type)))
  const lines: string[] = [`DNS health for ${domain}`]
  let missing = 0
  results.forEach((result, i) => {
    const type = RECORD_TYPES[i]
    if (result.status === "rejected") {
      lines.push(`  ${type}: lookup failed (${errorMessage(result.reason)})`)
      missing += 1
      return
    }
    const answers = answerLines(result.value)
    if (!answers.length) {
      lines.push(`  ${type}: none`)
      if (type === "A" || type === "NS") missing += 1
      return
    }
    lines.push(`  ${type}:`)
    answers.slice(0, 6).forEach((a) => lines.push(`    ${a}`))
  })
  const spf = results[4]?.status === "fulfilled"
    ? answerLines(results[4].value).find((a) => a.includes("v=spf1"))
    : undefined
  lines.push("", `Core records present: ${missing === 0 ? "yes" : `no (${missing} missing)`}`)
  lines.push(`SPF: ${spf ? spf.replace(/^TXT /, "") : "not published — mail from this domain is unprotected"}`)
  return lines.join("\n")
}

export interface HeaderAudit {
  header: string
  present: boolean
  value: string | null
  why: string
}

const SECURITY_HEADERS: Array<{ header: string; why: string }> = [
  { header: "strict-transport-security", why: "forces HTTPS for future visits" },
  { header: "content-security-policy", why: "blocks cross-site scripting and injected content" },
  { header: "x-frame-options", why: "stops clickjacking through iframes" },
  { header: "x-content-type-options", why: "stops MIME-sniffing attacks" },
  { header: "referrer-policy", why: "limits how much URL data leaks to other sites" },
  { header: "permissions-policy", why: "switches off browser features the site does not need" },
]

export async function securityHeaders(args: { url: string }): Promise<string> {
  const r = await request(args.url)
  const audit: HeaderAudit[] = SECURITY_HEADERS.map(({ header, why }) => ({
    header,
    present: Boolean(r.headers[header]),
    value: r.headers[header] ?? null,
    why,
  }))
  const present = audit.filter((a) => a.present).length
  const grade = present >= 6 ? "A" : present === 5 ? "B" : present === 4 ? "C" : present === 3 ? "D" : "F"
  const lines = [
    `Security headers for ${r.finalUrl} (HTTP ${r.status})`,
    `Grade: ${grade} — ${present} of ${audit.length} recommended headers present`,
    "",
  ]
  for (const a of audit) {
    lines.push(`${a.present ? "PASS" : "MISS"} ${a.header} — ${a.why}`)
    if (a.value) lines.push(`     ${a.value.slice(0, 300)}`)
  }
  if (r.headers["x-powered-by"]) lines.push("", `Note: x-powered-by discloses ${r.headers["x-powered-by"]} — consider removing it.`)
  return lines.join("\n")
}

/** One call that combines the HTTP, TLS, DNS and header checks a monitor would run. */
export async function siteReport(args: { url: string }): Promise<string> {
  const url = normalizeTarget(args.url)
  const [http, cert, dns] = await Promise.allSettled([
    request(url.toString()),
    fetchCertificate(url.hostname, url.port ? Number(url.port) : 443),
    dnsQuery(url.hostname, "A"),
  ])

  const lines: string[] = [`Site report for ${url.toString()}`, ""]

  if (http.status === "fulfilled") {
    const r = http.value
    lines.push(`HTTP: ${r.ok ? "UP" : "DOWN"} — ${r.status} ${r.statusText} in ${r.ms} ms`)
    lines.push(`  Final URL: ${r.finalUrl}${r.hops.length > 1 ? ` (${r.hops.length - 1} redirect(s))` : ""}`)
    const present = SECURITY_HEADERS.filter(({ header }) => r.headers[header]).length
    lines.push(`  Security headers: ${present}/${SECURITY_HEADERS.length}`)
  } else {
    lines.push(`HTTP: DOWN — ${errorMessage(http.reason)}`)
  }

  if (cert.status === "fulfilled") {
    const c = cert.value
    const state = c.daysRemaining < 0
      ? `expired ${Math.abs(c.daysRemaining)} day(s) ago`
      : `expires in ${c.daysRemaining} day(s)`
    lines.push(`TLS: ${c.subject.CN ?? url.hostname} issued by ${c.issuer.O ?? "unknown"} — ${state}`)
    lines.push(`  Trusted: ${c.authorized ? "yes" : `no (${c.authorizationError})`} | ${c.protocol}`)
  } else {
    lines.push(`TLS: unavailable — ${errorMessage(cert.reason)}`)
  }

  if (dns.status === "fulfilled") {
    const addresses = answerLines(dns.value)
    lines.push(`DNS: ${addresses.length ? addresses.join(", ") : "no A record published"}`)
  } else {
    lines.push(`DNS: unavailable — ${errorMessage(dns.reason)}`)
  }

  const healthy = http.status === "fulfilled" && http.value.ok
    && cert.status === "fulfilled" && cert.value.daysRemaining > 14
  lines.push("", `Verdict: ${healthy ? "healthy — reachable with a valid certificate" : "needs attention"}`)
  return lines.join("\n")
}
