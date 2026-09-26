import { connect } from "node:tls"
import type { TLSSocket } from "node:tls"
import { Socket } from "node:net"

const UA = "mrfentmen-statping-mcp/1.0"

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

interface HttpHop { url: string; status: number; location: string | null }

interface HttpResult {
  ok: boolean
  status: number
  statusText: string
  finalUrl: string
  ms: number
  bytes: number
  contentType: string
  server: string | null
  hops: HttpHop[]
  bodySnippet: string
}

/**
 * Fetches a URL and follows redirects by hand so the caller can see every hop.
 * This is exactly the check a status page runs, done live.
 */
async function request(target: string, timeoutMs = 15000): Promise<HttpResult> {
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
  return {
    ok: last.status >= 200 && last.status < 400,
    status: last.status,
    statusText: last.statusText,
    finalUrl: url.toString(),
    ms: Date.now() - start,
    bytes: Buffer.byteLength(body),
    contentType: last.headers.get("content-type") ?? "",
    server: last.headers.get("server"),
    hops,
    bodySnippet: body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200),
  }
}

export async function serviceStatus(args: { url: string }): Promise<string> {
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
      lines.push(`  ${i + 1}. ${hop.status} ${hop.url}${hop.location ? ` -> ${hop.location}` : ""}`)
    })
  }
  if (r.bodySnippet) lines.push("", `First text: ${r.bodySnippet}`)
  return lines.join("\n")
}

export async function checkServices(args: { urls: string[] }): Promise<string> {
  const urls = (args.urls ?? []).map((u) => String(u).trim()).filter(Boolean).slice(0, 10)
  if (!urls.length) return "Provide up to 10 URLs to check."
  const rows: string[] = []
  let up = 0
  // Sequential on purpose: a status page should not hammer a host from one IP at once.
  for (const url of urls) {
    try {
      const r = await request(url, 12000)
      if (r.ok) up += 1
      rows.push(`${r.ok ? "UP  " : "DOWN"} ${r.status} ${String(r.ms).padStart(6)} ms  ${url}${r.finalUrl !== url ? ` -> ${r.finalUrl}` : ""}`)
    } catch (e) {
      rows.push(`DOWN --- ${url}  (${errorMessage(e)})`)
    }
  }
  const down = urls.length - up
  return [
    `Checked ${urls.length} service(s): ${up} up, ${down} down.`,
    down ? "Anything marked DOWN is either unreachable or answered with an error status." : "Every service answered.",
    "",
    ...rows,
  ].join("\n")
}

interface PortResult { port: number; open: boolean; ms: number; service: string }

const WELL_KNOWN: Record<number, string> = {
  21: "FTP", 22: "SSH", 25: "SMTP", 53: "DNS", 80: "HTTP", 110: "POP3", 143: "IMAP",
  443: "HTTPS", 465: "SMTPS", 587: "SMTP submission", 993: "IMAPS", 995: "POP3S",
  3306: "MySQL", 5432: "PostgreSQL", 6379: "Redis", 8080: "HTTP alternate", 8443: "HTTPS alternate",
}

function probePort(host: string, port: number, timeoutMs = 8000): Promise<PortResult> {
  return new Promise<PortResult>((resolve) => {
    const start = Date.now()
    const socket = new Socket()
    const done = (open: boolean) => {
      socket.destroy()
      resolve({ port, open, ms: Date.now() - start, service: WELL_KNOWN[port] ?? "unknown service" })
    }
    socket.setTimeout(timeoutMs)
    socket.once("connect", () => done(true))
    socket.once("timeout", () => done(false))
    socket.once("error", () => done(false))
    socket.connect(port, host)
  })
}

export async function portCheck(args: { host: string; ports?: number[] }): Promise<string> {
  const host = normalizeTarget(args.host).hostname
  const ports = (args.ports?.length ? args.ports : [443, 80])
    .map((p) => Number(p))
    .filter((p) => Number.isInteger(p) && p > 0 && p < 65536)
    .slice(0, 10)
  if (!ports.length) return "Provide up to 10 TCP ports, for example [443, 80]."

  const results: PortResult[] = []
  // Sequential: many sockets at once from one address looks like an attack.
  for (const port of ports) results.push(await probePort(host, port))

  const open = results.filter((r) => r.open).length
  return [
    `TCP port check for ${host}`,
    `${open} of ${ports.length} port(s) accepting connections.`,
    "",
    ...results.map((r) => `${r.open ? "OPEN  " : "CLOSED"} ${String(r.port).padStart(5)} (${r.service}) ${String(r.ms).padStart(6)} ms`),
  ].join("\n")
}

const RESOLVERS = [
  { name: "Cloudflare", url: "https://cloudflare-dns.com/dns-query" },
  { name: "Google", url: "https://dns.google/resolve" },
  { name: "AdGuard", url: "https://dns.adguard-dns.com/resolve" },
]

interface DohAnswer { type?: number; TTL?: number; data?: string }
interface DohResponse { Status?: number; Answer?: DohAnswer[] }

async function queryResolver(base: string, name: string, type: string): Promise<DohResponse> {
  const res = await fetch(`${base}?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`, {
    headers: { "User-Agent": UA, Accept: "application/dns-json" },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as DohResponse
}

const values = (d: DohResponse): string[] =>
  (d.Answer ?? []).map((row) => String(row.data ?? "").trim())

export async function dnsPropagation(args: { domain: string; type?: string }): Promise<string> {
  const domain = normalizeTarget(args.domain).hostname
  const type = (args.type ?? "A").trim().toUpperCase()
  const results = await Promise.allSettled(RESOLVERS.map((r) => queryResolver(r.url, domain, type)))

  const lines = [`DNS propagation for ${domain} (${type})`, ""]
  const perResolver: string[][] = []
  results.forEach((result, i) => {
    const name = RESOLVERS[i].name
    if (result.status === "rejected") {
      lines.push(`${name}: lookup failed (${errorMessage(result.reason)})`)
      perResolver.push([])
      return
    }
    const answers = values(result.value)
    perResolver.push(answers)
    lines.push(answers.length
      ? `${name}: ${answers.join(", ")}`
      : `${name}: no ${type} answer (DNS status ${result.value.Status ?? 0})`)
  })

  const answered = perResolver.filter((a) => a.length)
  const first = answered[0] ?? []
  const agree = answered.length > 0 && answered.every((a) => a.length === first.length && a.every((v) => first.includes(v)))
  lines.push("")
  lines.push(agree
    ? `Propagation: consistent across ${answered.length} resolver(s).`
    : "Propagation: DIFFERENT answers between resolvers — either a change is still spreading or a resolver is serving stale data.")

  const ttls = results
    .filter((r): r is PromiseFulfilledResult<DohResponse> => r.status === "fulfilled")
    .flatMap((r) => (r.value.Answer ?? []).map((a) => a.TTL ?? 0))
  if (ttls.length) lines.push(`Lowest TTL: ${Math.min(...ttls)} second(s) — changes take about that long to spread.`)
  return lines.join("\n")
}

interface ChainCert {
  depth: number
  subject: string
  issuer: string
  validTo: string
  daysRemaining: number
  altNames: string[]
}

export async function sslChain(args: { host: string }): Promise<string> {
  const target = normalizeTarget(args.host)
  const host = target.hostname
  const port = target.port ? Number(target.port) : 443

  const chain = await new Promise<{ certs: ChainCert[]; authorized: boolean; error: string | null }>((resolve, reject) => {
    const socket: TLSSocket = connect({ host, port, servername: host, rejectUnauthorized: false, timeout: 15000 }, () => {
      const certs: ChainCert[] = []
      let current = socket.getPeerCertificate(true)
      const seen = new Set<string>()
      for (let depth = 0; depth < 10 && current; depth += 1) {
        const fingerprint = String(current.fingerprint ?? depth)
        if (seen.has(fingerprint)) break
        seen.add(fingerprint)
        const subject = (current.subject ?? {}) as Record<string, string>
        const issuer = (current.issuer ?? {}) as Record<string, string>
        const validTo = new Date(current.valid_to)
        certs.push({
          depth,
          subject: subject.CN ?? subject.O ?? "unknown",
          issuer: issuer.O ?? issuer.CN ?? "unknown",
          validTo: validTo.toISOString(),
          daysRemaining: Math.floor((validTo.getTime() - Date.now()) / 86400000),
          altNames: String(current.subjectaltname ?? "")
            .split(",")
            .map((n) => n.trim().replace(/^DNS:/, ""))
            .filter(Boolean),
        })
        const next = (current as { issuerCertificate?: unknown }).issuerCertificate
        if (!next || next === current) break
        current = next as typeof current
      }
      const result = {
        certs,
        authorized: socket.authorized,
        error: socket.authorized ? null : String(socket.authorizationError ?? "unknown"),
      }
      socket.destroy()
      resolve(result)
    })
    socket.on("error", (e) => reject(new Error(`TLS connection to ${host}:${port} failed: ${e.message}`)))
    socket.on("timeout", () => {
      socket.destroy()
      reject(new Error(`TLS connection to ${host}:${port} timed out.`))
    })
  })

  if (!chain.certs.length) return `No certificate chain returned by ${host}:${port}.`
  const lines = [
    `Certificate chain for ${host}:${port}`,
    `Chain depth: ${chain.certs.length} certificate(s)`,
    `Trusted: ${chain.authorized ? "yes" : `no (${chain.error})`}`,
    "",
  ]
  for (const cert of chain.certs) {
    lines.push(`${cert.depth === 0 ? "Leaf " : `CA ${cert.depth}`} — ${cert.subject}`)
    lines.push(`     issued by ${cert.issuer}`)
    lines.push(`     valid to ${cert.validTo} (${cert.daysRemaining} day(s) left)`)
    if (cert.depth === 0 && cert.altNames.length) lines.push(`     covers ${cert.altNames.slice(0, 10).join(", ")}`)
  }
  const soon = chain.certs.filter((c) => c.daysRemaining < 21)
  if (soon.length) lines.push("", `Attention: ${soon.length} certificate(s) in this chain expire within 21 days.`)
  return lines.join("\n")
}

/** The rollup a status page shows: which services are up, which are down, and the overall state. */
export async function statusSummary(args: { urls: string[] }): Promise<string> {
  const urls = (args.urls ?? []).map((u) => String(u).trim()).filter(Boolean).slice(0, 10)
  if (!urls.length) return "Provide up to 10 URLs to roll up."

  const rows: string[] = []
  const down: string[] = []
  let slowest = { url: "", ms: 0 }

  for (const url of urls) {
    try {
      const r = await request(url, 12000)
      if (r.ok) {
        if (r.ms > slowest.ms) slowest = { url, ms: r.ms }
        rows.push(`${r.ok ? "UP  " : "DOWN"} ${String(r.status).padStart(3)} ${String(r.ms).padStart(6)} ms  ${url}`)
      } else {
        down.push(url)
        rows.push(`DOWN ${String(r.status).padStart(3)} ${String(r.ms).padStart(6)} ms  ${url}`)
      }
    } catch (e) {
      down.push(url)
      rows.push(`DOWN ---        -  ${url}  (${errorMessage(e)})`)
    }
  }

  const up = urls.length - down.length
  const state = down.length === 0
    ? "All systems operational"
    : up === 0
      ? "Major outage — nothing answered"
      : "Partial outage"

  return [
    `Status: ${state}`,
    `${up} of ${urls.length} service(s) up.`,
    slowest.url ? `Slowest service: ${slowest.url} at ${slowest.ms} ms.` : "",
    down.length ? `Down: ${down.join(", ")}` : "",
    "",
    ...rows,
  ].filter((line) => line !== "").join("\n")
}
