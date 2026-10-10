import { connect } from "node:tls"
import type { TLSSocket } from "node:tls"
import { Socket } from "node:net"

const UA = "mrfentmen-uptimerobot-mcp/1.0"
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

interface HttpHop {
  url: string
  status: number
  location: string | null
}

interface HttpResult {
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
  "via",
  "x-cache",
]

/**
 * Fetches a URL and follows redirects by hand so the caller can see every hop.
 * This is exactly the check an uptime monitor runs, done live.
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

export async function checkEndpoints(args: { urls: string[] }): Promise<string> {
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
  const down = urls.length - up
  return [
    `Checked ${urls.length} endpoint(s): ${up} up, ${down} down.`,
    down ? "Anything marked DOWN is either unreachable or answered with an error status." : "Every endpoint answered.",
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

export async function portMonitor(args: { host: string; ports?: number[] }): Promise<string> {
  const host = normalizeTarget(args.host).hostname
  const ports = (args.ports?.length ? args.ports : [443, 80])
    .map((p) => Number(p))
    .filter((p) => Number.isInteger(p) && p > 0 && p < 65536)
    .slice(0, 10)
  if (!ports.length) return "Provide up to 10 TCP ports, for example [443, 80]."

  const results: PortResult[] = []
  // Sequential: a monitor opening many sockets at once looks like an attack.
  for (const port of ports) results.push(await probePort(host, port))

  const open = results.filter((r) => r.open).length
  return [
    `TCP port check for ${host}`,
    `${open} of ${ports.length} port(s) accepting connections.`,
    "",
    ...results.map((r) => `${r.open ? "OPEN  " : "CLOSED"} ${String(r.port).padStart(5)} (${r.service}) ${String(r.ms).padStart(6)} ms`),
  ].join("\n")
}

interface CertSummary {
  validTo: Date
  daysRemaining: number
  issuer: string
  subject: string
  authorized: boolean
  protocol: string
}

/** Reads the live leaf certificate off the host's own TLS handshake. */
function leafCertificate(hostname: string, port = 443): Promise<CertSummary> {
  return new Promise<CertSummary>((resolve, reject) => {
    const socket: TLSSocket = connect(
      { host: hostname, port, servername: hostname, rejectUnauthorized: false, timeout: 15000 },
      () => {
        const c = socket.getPeerCertificate()
        if (!c || !c.valid_to) {
          socket.destroy()
          reject(new Error(`No certificate returned by ${hostname}:${port}.`))
          return
        }
        const validTo = new Date(c.valid_to)
        const summary: CertSummary = {
          validTo,
          daysRemaining: Math.floor((validTo.getTime() - Date.now()) / 86400000),
          issuer: ((c.issuer ?? {}) as Record<string, string>).O ?? ((c.issuer ?? {}) as Record<string, string>).CN ?? "unknown",
          subject: ((c.subject ?? {}) as Record<string, string>).CN ?? hostname,
          authorized: socket.authorized,
          protocol: socket.getProtocol() ?? "unknown",
        }
        socket.destroy()
        resolve(summary)
      },
    )
    socket.on("error", (e) => reject(new Error(`TLS connection to ${hostname}:${port} failed: ${e.message}`)))
    socket.on("timeout", () => {
      socket.destroy()
      reject(new Error(`TLS connection to ${hostname}:${port} timed out.`))
    })
  })
}

export async function sslExpiry(args: { host: string }): Promise<string> {
  const host = normalizeTarget(args.host).hostname
  const info = await leafCertificate(host)
  const days = info.daysRemaining
  const status = days < 0
    ? `EXPIRED ${Math.abs(days)} day(s) ago — every visitor gets a browser warning`
    : days <= 7
      ? `CRITICAL: ${days} day(s) left`
      : days <= 30
        ? `WARNING: ${days} day(s) left`
        : `OK: ${days} day(s) left`

  return [
    `TLS certificate for ${host}`,
    `Status: ${status}`,
    `Expires: ${info.validTo.toISOString()}`,
    `Issuer: ${info.issuer}`,
    `Common name: ${info.subject}`,
    `Protocol: ${info.protocol}`,
    `Trusted chain: ${info.authorized ? "yes" : "no"}`,
    days >= 0 && days <= 30 ? "Renew before it lapses: an expired certificate shows every visitor a browser warning." : null,
  ].filter((line): line is string => line !== null).join("\n")
}

const RECORD_TYPES = ["A", "AAAA", "NS", "MX", "TXT", "CAA"] as const
const TYPE_NAMES: Record<number, string> = {
  1: "A", 2: "NS", 5: "CNAME", 6: "SOA", 15: "MX", 16: "TXT", 28: "AAAA", 257: "CAA",
}

interface DohAnswer { type?: number; TTL?: number; data?: string }
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

/** One call that combines the HTTP, TLS and DNS checks a monitor would run. */
export async function monitorReport(args: { url: string }): Promise<string> {
  const url = normalizeTarget(args.url)
  const [http, cert, dns] = await Promise.allSettled([
    request(url.toString()),
    leafCertificate(url.hostname, url.port ? Number(url.port) : 443),
    dnsQuery(url.hostname, "A"),
  ])

  const lines: string[] = [`Monitor report for ${url.toString()}`, ""]

  if (http.status === "fulfilled") {
    const r = http.value
    lines.push(`HTTP: ${r.ok ? "UP" : "DOWN"} — ${r.status} ${r.statusText} in ${r.ms} ms`)
    lines.push(`  Final URL: ${r.finalUrl}${r.hops.length > 1 ? ` (${r.hops.length - 1} redirect(s))` : ""}`)
  } else {
    lines.push(`HTTP: DOWN — ${errorMessage(http.reason)}`)
  }

  if (cert.status === "fulfilled") {
    const c = cert.value
    const state = c.daysRemaining < 0
      ? `expired ${Math.abs(c.daysRemaining)} day(s) ago`
      : `expires in ${c.daysRemaining} day(s)`
    lines.push(    `TLS: ${c.subject} issued by ${c.issuer} — ${state}`)
    lines.push(`  Trusted chain: ${c.authorized ? "yes" : "no"} | ${c.protocol}`)
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
  lines.push("", `Verdict: ${healthy ? "healthy — reachable over HTTPS with a valid certificate" : "needs attention, see the lines marked DOWN or unavailable"}`)
  return lines.join("\n")
}

// ---- muxH tools:
// The six existing tools all check something from this one server's vantage
// point. These two answer the two questions that stays blind: how the target
// looks from other countries, and how the monitoring vendor's own service has
// been behaving. Both read public, keyless sources.

const UR_UA = "mcfentmen-uptimerobot-mcp/1.1 (https://github.com/mcfentmen/uptimerobot-mcp)";
const UR_CHECK = "https://check-host.net";
const UR_STATUS = "https://status.uptimerobot.com/api";
// This identifier is published in the page's own asset URLs, so it is not a credential.
const UR_BOARD = "MQWpGhqM";

const urWait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface UrNode {
  [host: string]: [string, string, string, string, string];
}
interface UrStart {
  ok?: number;
  request_id?: string;
  nodes?: UrNode;
  permanent_link?: string;
}

interface UrMonitor {
  monitorId?: number;
  createdAt?: string;
  statusClass?: string;
  name?: string;
  type?: string;
  groupName?: string;
  dailyRatios?: { date?: string; ratio?: string; label?: string; color?: string }[];
  ratio?: string;
  "30dRatio"?: string;
  "90dRatio"?: string;
  lastDowntime?: number | string | null;
}
interface UrBoard {
  status?: string;
  data?: UrMonitor[];
  psp?: { monitors?: UrMonitor[] };
  statistics?: {
    latest_downtime?: unknown;
    counts?: { up?: number; down?: number; paused?: number; total?: number };
    count_result?: string;
  };
  days?: string[];
}

async function urJson<T>(url: string, label: string, accept = "application/json"): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "User-Agent": UR_UA, Accept: accept },
      signal: AbortSignal.timeout(30000),
    });
  } catch (e) {
    throw new Error(`Could not reach ${label}: ${(e as Error).message}`);
  }
  if (res.status === 429) throw new Error(`${label} is rate-limiting this client; try again in a minute.`);
  if (!res.ok) throw new Error(`${label} returned HTTP ${res.status}.`);
  return (await res.json()) as T;
}

/**
 * The same URL, requested from several countries at once. A single vantage point
 * cannot tell you that a site is down only in Europe or only in Asia, and that is
 * exactly the failure a monitor misses when it watches from one place.
 */
export async function multiRegionCheck(args: { url: string; nodes?: number }): Promise<string> {
  const raw = String(args?.url ?? "").trim();
  if (!raw) throw new Error("Give a URL to check, for example https://example.com.");
  const target = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    throw new Error(`"${args.url}" is not a URL.`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Only http and https can be checked; this URL is ${parsed.protocol}`);
  }
  const nodes = Math.min(Math.max(Number(args?.nodes ?? 4) || 4, 1), 8);

  const started = await urJson<UrStart>(
    `${UR_CHECK}/check-http?host=${encodeURIComponent(parsed.href)}&max_nodes=${nodes}`,
    "the multi-node checker",
  );
  if (!started.request_id || !started.nodes) {
    throw new Error("The multi-node checker accepted the request but returned no nodes to run it from.");
  }
  // The service runs the checks asynchronously and publishes results a few seconds later.
  await urWait(7000);
  let results: Record<string, unknown>;
  try {
    results = await urJson<Record<string, unknown>>(`${UR_CHECK}/check-result/${started.request_id}`, "the multi-node checker");
  } catch (e) {
    throw new Error(`The check was accepted (request ${started.request_id}) but its results could not be read: ${(e as Error).message}`);
  }

  interface Row {
    node: string;
    country: string;
    city: string;
    ip: string;
    asn: string;
    code: string | null;
    time: number | null;
    note: string | null;
  }
  const rows: Row[] = [];
  for (const [node, meta] of Object.entries(started.nodes)) {
    // Each node answers with [[ok, seconds, note, status, resolvedIp]]: the status
    // sits at index 3 and is null when the node never reached the target at all.
    const value = results[node];
    const tuple = Array.isArray(value) ? (value[0] as unknown[] | undefined) : undefined;
    const code = tuple && typeof tuple[3] === "string" ? tuple[3] : null;
    rows.push({
      node,
      country: meta?.[1] ?? "not reported",
      city: meta?.[2] ?? "not reported",
      ip: typeof tuple?.[4] === "string" ? tuple[4] : meta?.[3] ?? "not reported",
      asn: meta?.[4] ?? "not reported",
      code,
      time: typeof tuple?.[1] === "number" ? Number(tuple[1]) : null,
      note: typeof tuple?.[2] === "string" ? tuple[2] : null,
    });
  }

  const succeeded = rows.filter((r) => r.code !== null && /^2\d\d$/.test(r.code));
  const failed = rows.filter((r) => r.code !== null && !/^2\d\d$/.test(r.code));
  const unreachable = rows.filter((r) => r.code === null && r.note !== null);
  const missing = rows.filter((r) => r.code === null && r.note === null);
  const times = rows.map((r) => r.time).filter((t): t is number => t !== null);

  return [
    `Multi-region check of ${parsed.href}`,
    `  ${rows.length} node(s) asked: ${succeeded.length} returned 2xx, ${failed.length} returned a non-2xx status, ${unreachable.length} could not reach the target, ${missing.length} returned nothing yet`,
    started.permanent_link ? `  shareable result: ${started.permanent_link}` : "  no shareable result published",
    "",
    ...rows
      .sort((a, b) => (b.time ?? 0) - (a.time ?? 0))
      .map(
        (r, i) =>
          `  ${String(i + 1).padStart(2)}. ${r.country.padEnd(14)} ${r.city.slice(0, 16).padEnd(16)} ${r.code ? `HTTP ${r.code}` : "no result".padEnd(11)}` +
          ` ${r.time !== null ? `${(r.time * 1000).toFixed(0)} ms`.padStart(9) : "         -"}  as${r.asn} at ${r.ip}`,
      ),
    ...failed.map((r) => `     ${r.country} reported ${r.note ?? "no detail"}`),
    ...unreachable.map((r) => `     ${r.country} could not reach the target: ${r.note ?? "no detail given"}`),
    "",
    ...(times.length
      ? [
          `Response times across ${times.length} node(s): fastest ${(Math.min(...times) * 1000).toFixed(0)} ms, slowest ${(Math.max(...times) * 1000).toFixed(0)} ms, median ${(times.sort((a, b) => a - b)[Math.floor(times.length / 2)] * 1000).toFixed(0)} ms`,
        ]
      : []),
    ...(succeeded.length && (failed.length || unreachable.length)
      ? [
          `Mixed result: ${failed.length} of ${rows.length} node(s) did not get a 2xx, so the site is reachable from part of the world and not the rest. That pattern is invisible to a monitor watching from a single country, and it is usually a blocked route, a regional CDN edge or a geo-restriction rather than an outage.`,
        ]
      : ["All nodes that answered agreed, so nothing here suggests a region-specific fault."]),
    "",
    "These are third-party volunteer nodes on a public network, not a controlled measurement, so they carry that network's own conditions and can be slow, throttled or in a region that is simply blocked. Each result is a single request at one moment; the shareable link holds this run, and re-running gives a different sample.",
  ].join("\n");
}

/**
 * How UptimeRobot's own service has been behaving, from its public status board:
 * every monitor it publishes, its uptime ratio over the whole window and over 30
 * and 90 days, and the days it was not at full availability.
 */
export async function vendorUptime(args: { limit?: number }): Promise<string> {
  const limit = Math.min(Math.max(Number(args?.limit ?? 8) || 8, 1), 20);
  const board = await urJson<UrBoard>(`${UR_STATUS}/getMonitorList/${UR_BOARD}`, "UptimeRobot's public status board");
  const monitors = board.data ?? board.psp?.monitors ?? [];
  if (!monitors.length) throw new Error("UptimeRobot's status board published no monitors.");

  const days = board.days ?? [];
  const stats = board.statistics ?? {};
  const rows = monitors.map((m) => {
    const daily = (m.dailyRatios ?? []).map((d) => ({
      date: String(d.date ?? ""),
      ratio: Number(d.ratio ?? 0),
      label: d.label ?? "not reported",
    }));
    const imperfect = daily.filter((d) => d.ratio < 100);
    const worst = daily.reduce<{ date: string; ratio: number } | null>(
      (low, d) => (!low || d.ratio < low.ratio ? { date: d.date, ratio: d.ratio } : low),
      null,
    );
    return { monitor: m, daily, imperfect, worst };
  });
  const down = rows.filter((r) => String(r.monitor.statusClass ?? "") !== "success");
  const sorted = [...rows].sort((a, b) => (a.monitor.ratio ? Number(a.monitor.ratio) : 999) - (b.monitor.ratio ? Number(b.monitor.ratio) : 999));

  return [
    "UptimeRobot's own service record",
    `  window: ${days.length ? `${days[0]} to ${days[days.length - 1]}` : "dates not published"} (${days.length} day(s))`,
    `  ${monitors.length} monitor(s) published | ${stats.count_result ?? "summary not published"}: ${stats.counts?.up ?? 0} up, ${stats.counts?.down ?? 0} down, ${stats.counts?.paused ?? 0} paused`,
    stats.latest_downtime ? `  most recent downtime: ${JSON.stringify(stats.latest_downtime).slice(0, 200)}` : "  no downtime recorded in the published summary",
    "",
    `Monitors by overall ratio, worst first (${Math.min(limit, rows.length)} of ${rows.length}):`,
    ...sorted.slice(0, limit).map((r, i) => {
      const m = r.monitor;
      return (
        `  ${String(i + 1).padStart(2)}. ${String(m.name ?? "?").slice(0, 26).padEnd(26)} ${String(m.type ?? "?").padEnd(10)}` +
        ` overall ${String(m.ratio ?? "not reported").padStart(7)}%  30d ${String(m["30dRatio"] ?? "-").padStart(7)}%  90d ${String(m["90dRatio"] ?? "-").padStart(7)}%` +
        `  ${String(m.statusClass ?? "?") === "success" ? "up" : `state ${m.statusClass}`}  ${r.imperfect.length} imperfect day(s)`
      );
    }),
    "",
    "Days that were not a clean 100%:",
    ...(rows.some((r) => r.imperfect.length)
      ? rows
          .filter((r) => r.imperfect.length)
          .map((r) =>
            `  ${String(r.monitor.name ?? "?").slice(0, 26).padEnd(26)} worst ${r.worst ? `${r.worst.ratio.toFixed(2)}% on ${r.worst.date}` : "not reported"}` +
            `  days: ${r.imperfect.map((d) => `${d.date.slice(5)} ${d.ratio.toFixed(1)}%`).join(", ")}`,
          )
      : ["  none, every published day on every monitor was a clean 100%"]),
    ...down.length
      ? ["", `Not fully up right now: ${down.map((r) => `${r.monitor.name} (${r.monitor.statusClass})`).join(", ")}`]
      : [],
    "",
    "Ratios are UptimeRobot's own computation over its own checks, and a 100% day can still hide short blips below its sampling interval. These are UptimeRobot's corporate services, which are not the same thing as the monitors a paying account creates, so a clean board here says nothing about your own monitors.",
  ].join("\n");
}
