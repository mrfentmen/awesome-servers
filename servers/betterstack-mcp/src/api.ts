import { connect } from "node:tls"
import type { TLSSocket } from "node:tls"
import { resolve4 } from "node:dns/promises"

const UA = "mrfentmen-betterstack-mcp/1.0"
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

interface Hop { url: string; status: number; location: string | null; ms: number }

interface FetchOutcome {
  status: number
  statusText: string
  finalUrl: string
  ms: number
  headers: Headers
  html: string
  hops: Hop[]
  bytes: number
}

/** Fetches a URL hop by hop so every redirect is visible, and keeps the HTML for content checks. */
async function fetchChain(target: string, timeoutMs = 20000): Promise<FetchOutcome> {
  const start = Date.now()
  let url = normalizeTarget(target)
  const hops: Hop[] = []
  let res: Response | null = null

  for (let i = 0; i < 6; i += 1) {
    const hopStart = Date.now()
    res = await fetch(url, {
      redirect: "manual",
      headers: { "User-Agent": UA, Accept: "*/*" },
      signal: AbortSignal.timeout(timeoutMs),
    })
    const location = res.headers.get("location")
    hops.push({ url: url.toString(), status: res.status, location, ms: Date.now() - hopStart })
    if (res.status >= 300 && res.status < 400 && location) {
      url = new URL(location, url)
      continue
    }
    break
  }

  if (!res) throw new Error("No response received.")
  const body = await res.text()
  return {
    status: res.status,
    statusText: res.statusText,
    finalUrl: url.toString(),
    ms: Date.now() - start,
    headers: res.headers,
    html: body.slice(0, 200000),
    hops,
    bytes: Buffer.byteLength(body),
  }
}

function timeFor(target: string, samples: number, timeoutMs: number): Promise<Array<{ ms: number; status: number }>> {
  const url = normalizeTarget(target).toString()
  const run = async () => {
    const start = Date.now()
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "*/*" },
      signal: AbortSignal.timeout(timeoutMs),
    })
    // Read the body so the timing covers the whole transfer, not just the headers.
    await res.arrayBuffer()
    return { ms: Date.now() - start, status: res.status }
  }
  // Sequential so one check does not distort the next one's timing.
  return (async () => {
    const out: Array<{ ms: number; status: number }> = []
    for (let i = 0; i < samples; i += 1) out.push(await run())
    return out
  })()
}

export async function responseTimes(args: { url: string; samples?: number }): Promise<string> {
  const samples = Math.min(Math.max(Number(args.samples ?? 3) || 3, 2), 10)
  // One uncounted request first, so a cold DNS/TLS connection is not reported
  // as the site being unstable.
  await timeFor(args.url, 1, 20000)
  const results = await timeFor(args.url, samples, 20000)
  const times = results.map((r) => r.ms)
  const sorted = [...times].sort((a, b) => a - b)
  const median = sorted.length % 2 === 1
    ? sorted[(sorted.length - 1) / 2]
    : Math.round((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2)
  const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length)
  const spread = sorted[sorted.length - 1] - sorted[0]
  const failing = results.filter((r) => r.status >= 400 || r.status === 0).length
  const unsteady = spread > Math.max(100, median)

  return [
    `Response times for ${normalizeTarget(args.url).toString()} (${samples} sample(s), after one warm-up request)`,
    `min ${sorted[0]} ms | median ${median} ms | avg ${avg} ms | max ${sorted[sorted.length - 1]} ms`,
    `Jitter (max - min): ${spread} ms — ${unsteady ? "high, requests take noticeably different times" : "low, the site answers steadily"}`,
    `HTTP statuses seen: ${[...new Set(results.map((r) => r.status))].join(", ")}`,
    failing ? `Attention: ${failing} of ${samples} request(s) returned an error status.` : "",
    "",
    "Per-request: " + times.map((t, i) => `#${i + 1} ${t}ms`).join(", "),
  ].filter(Boolean).join("\n")
}

interface Timing {
  dnsMs: number
  connectMs: number
  tlsMs: number
  firstByteMs: number
  totalMs: number
}

/** Splits one request into the stages an observability tool would chart. */
async function measureTiming(target: string): Promise<Timing> {
  const url = normalizeTarget(target)
  const secure = url.protocol === "https:"
  const port = url.port ? Number(url.port) : secure ? 443 : 80

  const dnsStart = Date.now()
  await resolve4(url.hostname)
  const dnsMs = Date.now() - dnsStart

  const connectStart = Date.now()
  const handshake = await new Promise<{ connectMs: number; tlsMs: number }>((resolve, reject) => {
    const socket: TLSSocket = connect(
      secure
        ? { host: url.hostname, port, servername: url.hostname, rejectUnauthorized: false, timeout: 15000 }
        : { host: url.hostname, port, rejectUnauthorized: false, timeout: 15000 },
      () => {
        const connectMs = Date.now() - connectStart
        socket.destroy()
        resolve({ connectMs, tlsMs: secure ? connectMs : 0 })
      },
    )
    socket.on("error", (e) => reject(new Error(`Cannot open a TCP connection to ${url.hostname}:${port}: ${e.message}`)))
    socket.on("timeout", () => {
      socket.destroy()
      reject(new Error(`Connection to ${url.hostname}:${port} timed out.`))
    })
  })

  const requestStart = Date.now()
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "*/*" },
    signal: AbortSignal.timeout(20000),
  })
  const firstByteMs = Date.now() - requestStart
  await res.arrayBuffer()

  return {
    dnsMs,
    connectMs: handshake.connectMs,
    tlsMs: handshake.tlsMs,
    firstByteMs,
    totalMs: dnsMs + handshake.connectMs + (Date.now() - requestStart),
  }
}

export async function latencyBreakdown(args: { url: string }): Promise<string> {
  const url = normalizeTarget(args.url)
  const t = await measureTiming(url.toString())
  const slowest = Math.max(t.dnsMs, t.connectMs, t.firstByteMs)
  const stage = slowest === t.firstByteMs
    ? "the server itself — it takes the longest to start answering, which means slow code or a slow database, not a slow network"
    : slowest === t.connectMs
      ? "the network hop — connecting takes the longest, so the host is far away or the connection setup is slow"
      : "DNS — resolving the name takes the longest, so the resolver or the domain's nameservers need attention"

  return [
    `Latency breakdown for ${url.toString()}`,
    "",
    `  DNS lookup:       ${String(t.dnsMs).padStart(6)} ms`,
    `  TCP connect:      ${String(t.connectMs).padStart(6)} ms`,
    t.tlsMs ? `  TLS handshake:    ${String(t.tlsMs).padStart(6)} ms (included in the connect time)` : "  TLS handshake:    none (plain HTTP)",
    `  Time to headers:  ${String(t.firstByteMs).padStart(6)} ms`,
    `  Total:            ${String(t.totalMs).padStart(6)} ms`,
    "",
    `Slowest stage: ${stage}.`,
    t.totalMs > 2000
      ? "Total above 2 seconds: visitors on a slow connection will notice this."
      : "Total is inside the usual budget for a page request.",
  ].join("\n")
}

export async function contentCheck(args: { url: string }): Promise<string> {
  const page = await fetchChain(args.url, 20000)
  const html = page.html

  const meta = (name: string) => {
    const pattern = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`, "i")
    const reversed = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["']`, "i")
    return (html.match(pattern)?.[1] ?? html.match(reversed)?.[1] ?? "").trim()
  }

  const rawTitle = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ""
  const title = rawTitle.replace(/\s+/g, " ").trim()
  const description = meta("description")
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1] ?? ""
  const lang = html.match(/<html[^>]+lang=["']([^"']+)["']/i)?.[1] ?? ""
  const viewport = meta("viewport")
  const h1s = (html.match(/<h1[\s>]/gi) ?? []).length
  const images = (html.match(/<img[\s>]/gi) ?? []).length
  const imagesWithoutAlt = (html.match(/<img(?![^>]*\balt=)[^>]*>/gi) ?? []).length
  const scripts = (html.match(/<script[\s>]/gi) ?? []).length
  const stylesheets = (html.match(/<link[^>]+rel=["']stylesheet["']/gi) ?? []).length
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim()
  const words = text ? text.split(" ").length : 0

  const issues: string[] = []
  if (!title) issues.push("no <title> — search results and browser tabs show nothing useful")
  else if (title.length > 60) issues.push(`title is ${title.length} characters, search results cut it near 60`)
  if (!description) issues.push("no meta description — search engines invent one from the page")
  else if (description.length > 160) issues.push(`meta description is ${description.length} characters, search results cut it near 160`)
  if (!lang) issues.push("no lang attribute on <html> — screen readers cannot pick a voice")
  if (!viewport) issues.push("no viewport meta tag — the page will not scale on phones")
  if (h1s === 0) issues.push("no <h1> — the page has no stated headline")
  if (h1s > 1) issues.push(`${h1s} <h1> tags — a page should have exactly one`)
  if (imagesWithoutAlt) issues.push(`${imagesWithoutAlt} image(s) without alt text — invisible to screen readers and image search`)
  if (words < 150) issues.push(`only about ${words} words — thin pages rank poorly`)

  return [
    `Content check for ${page.finalUrl} (HTTP ${page.status})`,
    "",
    "Page metadata:",
    `  Title: ${title || "(missing)"}${title ? ` (${title.length} chars)` : ""}`,
    `  Description: ${description || "(missing)"}${description ? ` (${description.length} chars)` : ""}`,
    `  Canonical: ${canonical || "(not set)"}`,
    `  Language: ${lang || "(not declared)"}`,
    `  Viewport: ${viewport || "(not set)"}`,
    "",
    "Structure:",
    `  ${h1s} <h1>, ${images} image(s), ${scripts} <script>, ${stylesheets} stylesheet(s)`,
    `  About ${words} words of visible text | ${Math.round(page.bytes / 1024)} KB transferred`,
    "",
    issues.length
      ? `Problems found (${issues.length}):\n${issues.map((i) => `  - ${i}`).join("\n")}`
      : "No content problems found in the metadata or structure.",
  ].join("\n")
}

export async function redirectChain(args: { url: string }): Promise<string> {
  const r = await fetchChain(args.url, 15000)
  const lines = [`Redirect chain for ${normalizeTarget(args.url).toString()} — ${r.hops.length} hop(s)`, ""]
  r.hops.forEach((hop, i) => {
    lines.push(`${i + 1}. ${hop.status} ${hop.url} (${hop.ms} ms)`)
    if (hop.location) lines.push(`     -> ${hop.location}`)
  })

  const seen = new Set<string>()
  let loop = false
  for (const hop of r.hops) {
    if (seen.has(hop.url)) loop = true
    seen.add(hop.url)
  }
  const insecureFirst = r.hops[0]?.url.startsWith("http://") ?? false
  const endsSecure = r.finalUrl.startsWith("https://")
  const extra = r.hops.length - 1
  const slowest = [...r.hops].sort((a, b) => b.ms - a.ms)[0]

  lines.push("", `Final URL: ${r.finalUrl}`)
  lines.push(`Redirect loop: ${loop ? "YES — the chain revisits a URL" : "no"}`)
  lines.push(`Extra hops to remove: ${Math.max(extra - 1, 0)} (${extra} redirect(s) suggest a http->https or www->apex rule)`)
  if (insecureFirst) lines.push(`Starts on plain HTTP: yes ${endsSecure ? "and upgrades to HTTPS" : "and never upgrades to HTTPS"}`)
  if (slowest && slowest.ms > 300) lines.push(`Slowest hop: ${slowest.ms} ms at ${slowest.url} — a redirect that lands on a slow host is paid for twice`)
  if (r.hops.length >= 6) lines.push("Warning: the chain hit the 6-hop limit, so it may never terminate.")
  return lines.join("\n")
}

const HEADER_GROUPS: Array<{ name: string; headers: string[] }> = [
  { name: "Server and origin", headers: ["server", "via", "x-powered-by", "x-served-by", "x-backend"] },
  { name: "Caching and CDN", headers: ["cache-control", "age", "x-cache", "cf-cache-status", "etag", "last-modified", "vary"] },
  { name: "Compression and type", headers: ["content-encoding", "content-type", "content-length", "transfer-encoding"] },
  { name: "Security", headers: ["strict-transport-security", "content-security-policy", "x-frame-options", "x-content-type-options", "referrer-policy", "permissions-policy"] },
  { name: "Cookies", headers: ["set-cookie"] },
]

export async function headersReport(args: { url: string }): Promise<string> {
  const page = await fetchChain(args.url, 20000)
  const lines = [`Response headers for ${page.finalUrl} (HTTP ${page.status} ${page.statusText})`, ""]

  for (const group of HEADER_GROUPS) {
    lines.push(`${group.name}:`)
    const found = group.headers
      .map((h) => [h, page.headers.get(h)] as const)
      .filter(([, v]) => Boolean(v))
    if (!found.length) lines.push("  (none sent)")
    for (const [name, value] of found) lines.push(`  ${name}: ${String(value).slice(0, 300)}`)
    lines.push("")
  }

  const encoding = page.headers.get("content-encoding")
  const cacheControl = page.headers.get("cache-control") ?? ""
  const notes: string[] = []
  if (!encoding) notes.push("nothing is compressed — turn on gzip or brotli to shrink the transfer")
  if (!/max-age=\d+/.test(cacheControl)) notes.push("no cache max-age — browsers and CDNs will re-fetch this page every time")
  if (page.headers.get("x-powered-by")) notes.push("x-powered-by tells attackers the exact stack")
  if (page.headers.get("set-cookie") && !/httponly/i.test(page.headers.get("set-cookie") ?? "")) {
    notes.push("a cookie is set without HttpOnly — script on the page can read it")
  }
  if (!page.headers.get("strict-transport-security")) notes.push("no HSTS — a first plain-HTTP request can still be intercepted")

  lines.push(notes.length
    ? `Worth fixing (${notes.length}):\n${notes.map((n) => `  - ${n}`).join("\n")}`
    : "No problems found in the headers sent by this response.")
  return lines.join("\n")
}

interface DohAnswer { type?: number; data?: string }
interface DohResponse { Status?: number; Answer?: DohAnswer[] }

async function dnsA(name: string): Promise<string[]> {
  const res = await fetch(`${DOH}?name=${encodeURIComponent(name)}&type=A`, {
    headers: { "User-Agent": UA, Accept: "application/dns-json" },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`DNS-over-HTTPS returned ${res.status}`)
  const body = (await res.json()) as DohResponse
  return (body.Answer ?? []).map((row) => String(row.data ?? "").trim()).filter(Boolean)
}

/** One call combining reachability, latency, TLS and DNS for a single endpoint. */
export async function endpointSummary(args: { url: string }): Promise<string> {
  const url = normalizeTarget(args.url)
  const port = url.port ? Number(url.port) : url.protocol === "https:" ? 443 : 80

  const [timing, tls, dns] = await Promise.allSettled([
    measureTiming(url.toString()),
    new Promise<{ days: number; issuer: string }>((resolve, reject) => {
      const socket: TLSSocket = connect({ host: url.hostname, port, servername: url.hostname, rejectUnauthorized: false, timeout: 15000 }, () => {
        const c = socket.getPeerCertificate()
        socket.destroy()
        if (!c || !c.valid_to) {
          reject(new Error("no certificate returned"))
          return
        }
        resolve({
          days: Math.floor((new Date(c.valid_to).getTime() - Date.now()) / 86400000),
          issuer: ((c.issuer ?? {}) as Record<string, string>).O ?? "unknown",
        })
      })
      socket.on("error", (e) => reject(new Error(e.message)))
      socket.on("timeout", () => {
        socket.destroy()
        reject(new Error("timed out"))
      })
    }),
    dnsA(url.hostname),
  ])

  const lines: string[] = [`Endpoint summary for ${url.toString()}`, ""]

  if (timing.status === "fulfilled") {
    const t = timing.value
    lines.push(`Reachable: yes — total ${t.totalMs} ms (DNS ${t.dnsMs} ms, connect ${t.connectMs} ms, headers ${t.firstByteMs} ms)`)
    lines.push(`  Verdict: ${t.totalMs > 2000 ? "slow, over 2 seconds" : t.totalMs > 800 ? "acceptable but not quick" : "fast"}`)
  } else {
    lines.push(`Reachable: NO — ${errorMessage(timing.reason)}`)
  }

  if (tls.status === "fulfilled") {
    lines.push(`TLS: ${tls.value.issuer} — ${tls.value.days} day(s) left${tls.value.days < 14 ? " (renew soon)" : ""}`)
  } else {
    lines.push(`TLS: unavailable — ${errorMessage(tls.reason)}`)
  }

  if (dns.status === "fulfilled") {
    lines.push(`DNS: ${dns.value.length ? dns.value.join(", ") : "no A record published"}`)
  } else {
    lines.push(`DNS: unavailable — ${errorMessage(dns.reason)}`)
  }

  return lines.join("\n")
}
