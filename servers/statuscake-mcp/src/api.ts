import { connect } from "node:tls"
import { Socket } from "node:net"

const UA = "mrfentmen-statuscake-mcp/1.0"

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

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

export async function checkUrl(args: { url: string }): Promise<string> {
  const url = normalizeTarget(args.url)
  const start = Date.now()
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "*/*" },
    signal: AbortSignal.timeout(20000),
  })
  await res.arrayBuffer()
  const ms = Date.now() - start
  const up = res.status < 400
  return [
    `${up ? "UP" : "DOWN"} — ${url.toString()}`,
    `HTTP ${res.status} ${res.statusText} in ${ms} ms`,
    `Redirected to: ${res.url || url.toString()}`,
    `Server: ${res.headers.get("server") ?? "not disclosed"}`,
    up ? "Check passed." : "Check failed: the server answered with an error status.",
  ].join("\n")
}

interface PortResult { host: string; port: number; open: boolean; ms: number; service: string }

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
      resolve({ host, port, open, ms: Date.now() - start, service: WELL_KNOWN[port] ?? "unknown service" })
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
  // Sequential: a monitor opening many sockets at once looks like an attack.
  for (const port of ports) results.push(await probePort(host, port))

  const rows = results.map((r) =>
    `${r.open ? "OPEN  " : "CLOSED"} ${String(r.port).padStart(5)} (${r.service}) ${String(r.ms).padStart(6)} ms`)
  const open = results.filter((r) => r.open).length
  return [
    `TCP port check for ${host}`,
    `${open} of ${ports.length} port(s) accepting connections.`,
    "",
    ...rows,
  ].join("\n")
}

export interface ChainCert {
  depth: number
  subject: string
  issuer: string
  validTo: string
  daysRemaining: number
  altNames: string[]
}

export async function sslChain(args: { host: string }): Promise<string> {
  const host = normalizeTarget(args.host).hostname
  const port = normalizeTarget(args.host).port ? Number(normalizeTarget(args.host).port) : 443

  const chain = await new Promise<{ certs: ChainCert[]; authorized: boolean; error: string | null }>((resolve, reject) => {
    const socket = connect({ host, port, servername: host, rejectUnauthorized: false, timeout: 15000 }, () => {
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
    : `Propagation: DIFFERENT answers between resolvers — either a change is still spreading or a resolver is serving stale data.`)

  const ttls = results
    .filter((r): r is PromiseFulfilledResult<DohResponse> => r.status === "fulfilled")
    .flatMap((r) => (r.value.Answer ?? []).map((a) => a.TTL ?? 0))
  if (ttls.length) lines.push(`Lowest TTL: ${Math.min(...ttls)} second(s) — changes take about that long to spread.`)
  return lines.join("\n")
}

/** One call that runs every check a monitoring service would run on a host. */
export async function uptimeReport(args: { url: string }): Promise<string> {
  const url = normalizeTarget(args.url)
  const port = url.port ? Number(url.port) : url.protocol === "https:" ? 443 : 80
  const lines = [`Uptime report for ${url.toString()}`, ""]

  const http = await Promise.allSettled([
    fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) }),
  ])
  const response = http[0]
  if (response.status === "fulfilled") {
    await response.value.arrayBuffer()
    lines.push(`HTTP: ${response.value.status < 400 ? "UP" : "DOWN"} — ${response.value.status} ${response.value.statusText}`)
  } else {
    lines.push(`HTTP: DOWN — ${errorMessage(response.reason)}`)
  }

  const tcp = await probePort(url.hostname, port)
  lines.push(`TCP ${port}: ${tcp.open ? `open in ${tcp.ms} ms` : "not accepting connections"}`)

  const certs = await Promise.allSettled([
    new Promise<ChainCert[]>((resolve, reject) => {
      const socket = connect({ host: url.hostname, port, servername: url.hostname, rejectUnauthorized: false, timeout: 15000 }, () => {
        const c = socket.getPeerCertificate()
        socket.destroy()
        if (!c || !c.valid_to) {
          reject(new Error("no certificate returned"))
          return
        }
        const validTo = new Date(c.valid_to)
        resolve([{
          depth: 0,
          subject: ((c.subject ?? {}) as Record<string, string>).CN ?? url.hostname,
          issuer: (((c.issuer ?? {}) as Record<string, string>).O) ?? "unknown",
          validTo: validTo.toISOString(),
          daysRemaining: Math.floor((validTo.getTime() - Date.now()) / 86400000),
          altNames: [],
        }])
      })
      socket.on("error", (e) => reject(new Error(e.message)))
      socket.on("timeout", () => {
        socket.destroy()
        reject(new Error("timed out"))
      })
    }),
  ])
  const leaf = certs[0]
  let certHealthy = false
  if (leaf.status === "fulfilled") {
    const c = leaf.value[0]
    certHealthy = c.daysRemaining > 7
    lines.push(`SSL: ${c.subject} from ${c.issuer} — ${c.daysRemaining} day(s) left`)
  } else {
    lines.push(`SSL: unavailable (${errorMessage(leaf.reason)})`)
  }

  const dns = await Promise.allSettled([queryResolver(RESOLVERS[0].url, url.hostname, "A")])
  if (dns[0].status === "fulfilled") {
    const answers = values(dns[0].value)
    lines.push(`DNS: ${answers.length ? answers.join(", ") : "no A record"}`)
  } else {
    lines.push(`DNS: unavailable (${errorMessage(dns[0].reason)})`)
  }

  const healthy = response.status === "fulfilled" && response.value.status < 400 && tcp.open && certHealthy
  lines.push("", `Verdict: ${healthy ? "healthy — serving traffic over HTTPS" : "needs attention, see the lines marked DOWN or unavailable"}`)
  return lines.join("\n")
}
