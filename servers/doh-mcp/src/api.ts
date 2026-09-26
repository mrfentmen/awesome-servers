/**
 * DNS-over-HTTPS client, keyless.
 * Cloudflare, Google and AdGuard all serve the RFC 8484 JSON API over HTTP.
 */

export class DohError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DohError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = "mrfentmen-doh-mcp/1.0"

/** Resolvers that speak the DoH JSON API. */
export const PROVIDERS: Record<string, string> = {
  cloudflare: "https://cloudflare-dns.com/dns-query",
  google: "https://dns.google/resolve",
  adguard: "https://dns.adguard-dns.com/resolve",
}

export const PROVIDER_NAMES = Object.keys(PROVIDERS)

export const RECORD_TYPES = [
  "A",
  "AAAA",
  "CNAME",
  "MX",
  "TXT",
  "NS",
  "SOA",
  "CAA",
  "SRV",
  "PTR",
] as const

export interface DohAnswer {
  name: string
  type: number
  TTL: number
  data: string
}

export interface DohResult {
  status: number
  statusText: string
  comment?: string
  answers: DohAnswer[]
  authority: DohAnswer[]
}

const TYPE_NAMES: Record<number, string> = {
  1: "A",
  2: "NS",
  5: "CNAME",
  6: "SOA",
  12: "PTR",
  15: "MX",
  16: "TXT",
  28: "AAAA",
  33: "SRV",
  43: "DS",
  48: "DNSKEY",
  257: "CAA",
}

const RCODES: Record<number, string> = {
  0: "NOERROR",
  1: "FORMERR",
  2: "SERVFAIL",
  3: "NXDOMAIN",
  4: "NOTIMP",
  5: "REFUSED",
}

export function typeName(code: number): string {
  return TYPE_NAMES[code] ?? `TYPE${code}`
}

export function rcodeName(code: number): string {
  return RCODES[code] ?? `RCODE${code}`
}

export function normaliseProvider(provider?: string): string {
  const p = (provider ?? "cloudflare").toLowerCase().trim()
  if (!(p in PROVIDERS)) {
    throw new DohError(`Unknown provider "${provider}". Use one of: ${PROVIDER_NAMES.join(", ")}.`)
  }
  return p
}

export function normaliseType(type?: string): string {
  const t = (type ?? "A").toUpperCase().trim()
  if (!/^[A-Z0-9]+$/.test(t)) throw new DohError(`"${type}" is not a DNS record type.`)
  return t
}

async function query(name: string, type: string, provider: string): Promise<DohResult> {
  const clean = name.trim().replace(/\.$/, "")
  if (!clean) throw new DohError("Record name is required.")
  const q = new URLSearchParams({ name: clean, type })
  let res: Response
  try {
    res = await fetch(`${PROVIDERS[provider]}?${q.toString()}`, {
      headers: { "User-Agent": UA, Accept: "application/dns-json" },
      signal: AbortSignal.timeout(15000),
    })
  } catch (e) {
    throw new DohError(`Could not reach the ${provider} resolver: ${errorMessage(e)}`)
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 200)
    throw new DohError(`The ${provider} resolver returned HTTP ${res.status}: ${body}`)
  }
  let json: { Status?: number; Comment?: string; Answer?: DohAnswer[]; Authority?: DohAnswer[] }
  try {
    json = (await res.json()) as typeof json
  } catch {
    throw new DohError(`The ${provider} resolver did not return JSON.`)
  }
  const status = typeof json.Status === "number" ? json.Status : 0
  return {
    status,
    statusText: rcodeName(status),
    comment: json.Comment,
    answers: Array.isArray(json.Answer) ? json.Answer : [],
    authority: Array.isArray(json.Authority) ? json.Authority : [],
  }
}

/** One lookup. Returns status instead of throwing, so callers can report NXDOMAIN. */
export function resolve(name: string, type: string, provider: string): Promise<DohResult> {
  return query(name, normaliseType(type), normaliseProvider(provider))
}

/** Unwrap the quoted chunks a TXT record is split into. */
export function txtValue(data: string): string {
  const chunks = data.match(/"([^"]*)"/g)
  if (chunks && chunks.length > 0) return chunks.map((c) => c.slice(1, -1)).join("")
  return data.trim()
}

/** Split a CAA record into flags, tag and value. */
export function caaParts(data: string): { flags: number; tag: string; value: string } {
  const m = data.trim().match(/^(\d+)\s+([a-z0-9]+)\s+"?([^"]*)"?$/i)
  if (!m) return { flags: 0, tag: "?", value: data.trim() }
  return { flags: Number(m[1]), tag: m[2].toLowerCase(), value: m[3] }
}

function formatValue(a: DohAnswer): string {
  if (a.type === 16) return txtValue(a.data)
  if (a.type === 257) {
    const p = caaParts(a.data)
    return `${p.tag} ${p.value}${p.flags & 128 ? " (critical)" : ""}`
  }
  return a.data
}

export function formatAnswer(name: string, type: string, provider: string, res: DohResult): string {
  const header = `${type} records for ${name} (via ${provider})`
  if (res.answers.length === 0) {
    const why = res.status === 0 ? "No records of that type." : `${res.statusText}.`
    return `${header}\n\n${why}${res.comment ? ` ${res.comment}` : ""}`
  }
  const rows = res.answers.map(
    (a) => `  ${formatValue(a)}${a.TTL ? `   (TTL ${a.TTL}s)` : ""}`
  )
  return `${header}\n\n${rows.join("\n")}`
}

export async function resolveMany(
  names: string[],
  type: string,
  provider: string
): Promise<string> {
  const list = names.map((n) => n.trim()).filter(Boolean).slice(0, 15)
  if (list.length === 0) throw new DohError("Give at least one name.")
  const results = await Promise.all(
    list.map(async (n) => {
      try {
        const res = await resolve(n, type, provider)
        if (res.answers.length === 0) return `  ${n}  ->  ${res.statusText}`
        return formatAnswer(n, type, provider, res)
          .split("\n")
          .slice(2)
          .map((line) => (line ? `${n}${line}` : line))
          .join("\n")
      } catch (e) {
        return `  ${n}  ->  ${errorMessage(e)}`
      }
    })
  )
  return `${type} lookup for ${list.length} name(s) via ${provider}:\n\n${results.join("\n\n")}`
}

const SUMMARY_TYPES = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SOA", "CAA"] as const

export async function recordSummary(domain: string, provider: string): Promise<string> {
  const results = await Promise.all(
    SUMMARY_TYPES.map(async (type) => {
      try {
        return { type, res: await resolve(domain, type, provider) }
      } catch (e) {
        return { type, error: errorMessage(e) }
      }
    })
  )
  const lines: string[] = []
  for (const r of results) {
    if ("error" in r) {
      lines.push(`${r.type.padEnd(6)} error: ${r.error}`)
      continue
    }
    if (r.res.answers.length === 0) continue
    const values = r.res.answers.map((a) => formatValue(a))
    lines.push(`${r.type.padEnd(6)} ${values.join("\n       ")}`)
  }
  const first = results.find((r) => !("error" in r) && r.res.answers.length > 0) as
    | { res: DohResult }
    | undefined
  const head = `${domain} DNS summary (via ${provider})`
  if (lines.length === 0) {
    return `${head}\n\nNo records found.${first ? "" : " The domain may not exist."}`
  }
  return `${head}\n\n${lines.join("\n")}\n\n${first?.res.statusText ?? ""}`.trimEnd()
}

export async function emailRecords(domain: string, provider: string): Promise<string> {
  const [mx, txt, dmarcRes, caaRes] = await Promise.all([
    resolve(domain, "MX", provider),
    resolve(domain, "TXT", provider),
    resolve(`_dmarc.${domain}`, "TXT", provider),
    resolve(domain, "CAA", provider),
  ])
  const spf = txt.answers
    .filter((a) => a.type === 16)
    .map((a) => txtValue(a.data))
    .filter((t) => t.toLowerCase().startsWith("v=spf1"))
  const dmarc = dmarcRes.answers.filter((a) => a.type === 16).map((a) => txtValue(a.data))
  const mxLines = mx.answers.map((a) => {
    const [pref, host] = a.data.split(/\s+/)
    return `  ${pref.padStart(3)}  ${host}`
  })
  const sections = [
    `Email DNS for ${domain} (via ${provider})`,
    "",
    `MX (${mx.answers.length})`,
    mxLines.length ? mxLines.join("\n") : "  none - the domain cannot receive mail",
    "",
    `SPF: ${spf.length ? spf.join(" | ") : "missing"}`,
    `DMARC: ${dmarc.length ? dmarc.join(" | ") : "missing"}`,
    `CAA: ${caaRes.answers.length ? caaRes.answers.map((a) => formatValue(a)).join(", ") : "none"}`,
  ]
  const problems: string[] = []
  if (!spf.length) problems.push("no SPF record")
  if (!dmarc.length) problems.push("no DMARC record")
  if (!mx.answers.length) problems.push("no MX record")
  if (problems.length) sections.push("", `Note: ${problems.join(", ")}.`)
  return sections.join("\n")
}

export async function caaRecords(domain: string, provider: string): Promise<string> {
  const res = await resolve(domain, "CAA", provider)
  if (res.answers.length === 0) {
    return `No CAA records for ${domain} - any certificate authority may issue for it.`
  }
  const lines = res.answers.map((a) => {
    const p = caaParts(a.data)
    return `  ${p.tag.padEnd(8)} ${p.value}${p.flags ? `  (flags ${p.flags})` : ""}`
  })
  return `CAA records for ${domain} (via ${provider}):\n\n${lines.join("\n")}`
}

export function reverseName(ip: string): string {
  const clean = ip.trim()
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(clean)) {
    return `${clean.split(".").reverse().join(".")}.in-addr.arpa`
  }
  if (clean.includes(":")) {
    const expanded = expandIpv6(clean)
    return `${expanded.split("").reverse().join(".")}.ip6.arpa`
  }
  throw new DohError(`"${ip}" is not an IPv4 or IPv6 address.`)
}

function expandIpv6(ip: string): string {
  const [head, tail] = ip.split("::")
  const headParts = head ? head.split(":") : []
  const tailParts = tail ? tail.split(":") : []
  const missing = 8 - headParts.length - tailParts.length
  if (ip.includes("::") && missing < 0) throw new DohError(`"${ip}" is not a valid IPv6 address.`)
  const groups = ip.includes("::")
    ? [...headParts, ...Array(missing).fill("0"), ...tailParts]
    : headParts
  if (groups.length !== 8) throw new DohError(`"${ip}" is not a valid IPv6 address.`)
  return groups.map((g) => g.padStart(4, "0")).join("")
}

export async function reverseLookup(ip: string, provider: string): Promise<string> {
  const ptrName = reverseName(ip)
  const res = await resolve(ptrName, "PTR", provider)
  if (res.answers.length === 0) return `No PTR record for ${ip} (${res.statusText}).`
  const names = res.answers.map((a) => a.data.replace(/\.$/, ""))
  return `${ip} -> ${names.join(", ")}`
}

export function providersHelp(): string {
  const lines = PROVIDER_NAMES.map((p) => `  ${p.padEnd(11)} ${PROVIDERS[p]}`)
  return [
    "Keyless DNS-over-HTTPS resolvers:",
    "",
    ...lines,
    "",
    `Record types: ${RECORD_TYPES.join(", ")}`,
  ].join("\n")
}
