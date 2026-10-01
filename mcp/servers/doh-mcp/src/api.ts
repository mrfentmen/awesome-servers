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
// ---- batch-4 tools: DNSSEC, propagation, TXT checks (2026-09-27) ----
interface DohRaw {
  Status?: number
  AD?: boolean
  Answer?: DohAnswer[]
}

async function rawQuery(name: string, type: string, provider: string): Promise<DohRaw> {
  const clean = name.trim().replace(/\.$/, "")
  if (!clean) throw new DohError("Record name is required.")
  const res = await fetch(
    `${PROVIDERS[provider]}?name=${encodeURIComponent(clean)}&type=${encodeURIComponent(type)}&do=true`,
    { headers: { "User-Agent": UA, Accept: "application/dns-json" }, signal: AbortSignal.timeout(15000) }
  )
  if (!res.ok) throw new DohError(`The ${provider} resolver returned HTTP ${res.status}`)
  return (await res.json()) as DohRaw
}

export async function dnssecCheck(args: { domain: string; provider?: string }): Promise<string> {
  const domain = (args.domain ?? "").trim().replace(/\.$/, "")
  if (!domain) throw new DohError("Give a domain, e.g. example.com")
  const provider = normaliseProvider(args.provider)
  const [key, ds] = await Promise.all([
    rawQuery(domain, "DNSKEY", provider),
    rawQuery(domain, "DS", provider),
  ])
  const keys = (key.Answer ?? []).filter((a) => a.type === 48)
  const dsRows = (ds.Answer ?? []).filter((a) => a.type === 43)
  const validated = key.AD === true || ds.AD === true
  const lines = [
    `DNSSEC for ${domain} (via ${provider}, DO bit set)`,
    `Validated by the resolver (AD flag): ${validated ? "yes" : "no"}`,
    `DNSKEY records published: ${keys.length}`,
    `DS records at the delegation: ${dsRows.length}`,
  ]
  if (dsRows.length) lines.push(`DS: ${dsRows.map((a) => txtValue(a.data)).slice(0, 4).join(" | ")}`)
  lines.push(
    "",
    validated && keys.length
      ? "The zone is signed and the resolver validated the chain of trust."
      : "Not validated: either the zone is unsigned, or the DS record is missing at the registrar/parent zone, which breaks the chain."
  )
  return lines.join("\n")
}

export async function propagationCheck(args: { name: string; type?: string; provider?: string }): Promise<string> {
  const name = (args.name ?? "").trim().replace(/\.$/, "")
  if (!name) throw new DohError("Give a hostname to check, e.g. www.example.com")
  const type = normaliseType(args.type)
  const providers = args.provider ? [normaliseProvider(args.provider)] : [...PROVIDER_NAMES]
  const rows: string[] = []
  const seen = new Map<string, string[]>()
  for (const provider of providers) {
    try {
      const res = await resolve(name, type, provider)
      const values = res.answers.map((a) => formatValue(a)).sort()
      const key = values.join(" | ") || res.statusText
      seen.set(key, [...(seen.get(key) ?? []), provider])
      rows.push(`${provider.padEnd(11)} ${values.length ? values.slice(0, 3).join(", ") : res.statusText}`)
    } catch (e) {
      rows.push(`${provider.padEnd(11)} error: ${errorMessage(e)}`)
    }
  }
  const agreeing = seen.size <= 1
  return [
    `${type} propagation for ${name} across ${providers.length} resolver(s)`,
    agreeing
      ? "All resolvers returned the same answer."
      : "Resolvers DISAGREE - the record has not propagated everywhere yet, or a CDN answers differently per region:",
    "",
    ...rows,
    ...(agreeing ? [] : ["", ...[...seen.entries()].map(([values, names]) => `${names.join(", ")}: ${values}`)]),
  ].join("\n")
}

export async function txtContains(args: { domain: string; value: string; provider?: string }): Promise<string> {
  const domain = (args.domain ?? "").trim().replace(/\.$/, "")
  const needle = (args.value ?? "").trim()
  if (!domain || !needle) throw new DohError("Give a domain and the text to look for")
  const provider = normaliseProvider(args.provider)
  const res = await resolve(domain, "TXT", provider)
  const values = res.answers.filter((a) => a.type === 16).map((a) => txtValue(a.data))
  const hits = values.filter((v) => v.toLowerCase().includes(needle.toLowerCase()))
  return [
    `TXT records for ${domain} (via ${provider}): ${values.length}`,
    hits.length ? `MATCH - ${hits.length} record(s) contain "${needle}":` : `No TXT record contains "${needle}".`,
    ...hits.map((h) => `  ${h.slice(0, 300)}`),
    "",
    "All TXT values:",
    ...(values.length ? values.slice(0, 10).map((v) => `  ${v.slice(0, 300)}`) : ["  none"]),
  ].join("\n")
}

// ---- muxD tools:

/**
 * Works out what actually happened on a lookup. A bare "no answer" is ambiguous:
 * the name may not exist, or it may exist with no record of that type, or the
 * resolver may have failed, or refused. Each needs a different next step, so this
 * spells out which one it is.
 */
async function classify(name: string, type: string, provider: string): Promise<{ label: string; detail: string; advice: string }> {
  const res = await resolve(name, type, provider)
  if (res.status === 0 && res.answers.length > 0) {
    return { label: "ANSWERED", detail: `${res.answers.length} answer(s) returned`, advice: "The record resolves. If you expected something else, check the type you asked for and whether a CNAME is redirecting you." }
  }
  if (res.status === 0) {
    const soa = res.authority.find((a) => a.type === 6)
    return {
      label: "NO DATA (NODATA)",
      detail: `The name exists but publishes no ${type} record${soa ? `; the authority section carries the SOA of ${cfName(soa.data)}` : ""}`,
      advice: `This is not a typo or a missing domain. Either the ${type} record was never created, or it was removed. A null MX of "0 ." is the deliberate way to say "do not send mail here".`,
    }
  }
  if (res.status === 3) {
    return {
      label: "NXDOMAIN",
      detail: "The name does not exist at all in DNS",
      advice: "Either the hostname is wrong, or the domain has no delegation for it. If the parent domain also returns NXDOMAIN, the domain itself is not delegated. If the parent resolves, the label simply does not exist.",
    }
  }
  if (res.status === 2) {
    const c = cfComment(res.comment)
    return {
      label: "SERVFAIL",
      detail: `The resolver reached a server that failed${c ? `: ${c}` : ""}`,
      advice: c && /DNSSEC|DNSKEY|DS|SEC/i.test(c)
        ? "This is a DNSSEC validation failure, not a missing record. A validating resolver refuses the answer because the chain of trust is broken, usually a DS in the parent with no matching DNSKEY in the child. A non-validating resolver will still answer it, which is why the same name can work in a browser and fail in a script."
        : "The authoritative server for this zone returned an error. Common causes are broken DNSSEC, a lame delegation pointing at nameservers that do not answer, or an authoritative server that is down. Trying a second resolver tells you whether the problem is the zone or your path.",
    }
  }
  if (res.status === 5) {
    return { label: "REFUSED", detail: "The resolver refused to answer this query", advice: "Usually a policy block: the resolver is configured to refuse this name or type, often because the domain is on a blocklist. Switching resolver is the quickest test." }
  }
  if (res.status === 1) {
    return { label: "FORMERR", detail: "The resolver could not parse the question", advice: `Check the name and type. "${type}" is a valid type here, so the name is the likely problem, particularly if it contains a stray character or is not a valid hostname.` }
  }
  return { label: `RCODE ${res.status}`, detail: res.statusText, advice: "Unexpected response code. Running propagation_check across the available resolvers will show whether this is specific to one resolver." }
}

const cfComment = (c: unknown): string => {
  if (c === null || c === undefined || c === "") return ""
  if (Array.isArray(c)) return c.map((x) => String(x)).join("; ")
  return String(c)
}

/** Pull the owner name out of an SOA record's rdata. */
const cfName = (rdata: string): string => {
  const first = String(rdata ?? "").trim().split(/\s+/)[0] ?? ""
  return first.replace(/\.$/, "")
}

export interface DiagnoseArgs {
  name: string;
  type?: string;
  provider?: string;
}

export interface DelegationArgs {
  domain: string;
  max_hops?: number;
  provider?: string;
}

const WILDCARD_LABELS = ["zzq7x-null-check", "null-check-zzq7x", "wxtest9x2", "nonexistent-probe-4k2"]

export interface WildcardArgs {
  domain: string;
  provider?: string;
}

/** Whether a zone answers for any name at all, which is the usual reason an unexpected record resolves. */
export async function wildcardCheck(args: WildcardArgs): Promise<string> {
  const domain = (args.domain ?? "").trim().toLowerCase().replace(/\.$/, "")
  if (!domain || !domain.includes(".")) throw new DohError("Give a domain like example.com")
  const provider = normaliseProvider(args.provider)

  const lines = [`Wildcard test for ${domain} via ${provider}:`, ""]
  const types: Array<[string, string]> = [["A", "1"], ["CNAME", "5"], ["TXT", "16"]]
  const hits: string[] = []
  let nxdomain = 0
  let nodata = 0
  let other = 0
  for (const [type, _code] of types) {
    const answers: string[] = []
    // Track whether a probe actually returned data, rather than inspecting the
    // rendered text: NODATA means no record exists and must not read as a hit.
    let answered = false
    for (const label of WILDCARD_LABELS) {
      const probe = `${label}.${domain}`
      let res: DohResult
      try {
        res = await resolve(probe, type, provider)
      } catch (e) {
        answers.push(`${label}: error ${errorMessage(e)}`)
        continue
      }
      if (res.status === 0 && res.answers.length) {
        answered = true
        answers.push(`${label} -> ${res.answers.map((a) => a.data).slice(0, 2).join(", ")}`)
      } else if (res.status === 3) {
        // The label does not exist at all.
        nxdomain += 1
        answers.push(`${label} -> NXDOMAIN (no such name)`)
      } else if (res.status === 0) {
        // The name exists but holds nothing of this type, which is a different
        // answer from the name not existing, and is not a wildcard.
        nodata += 1
        answers.push(`${label} -> NODATA (name exists, no ${type} record)`)
      } else {
        other += 1
        answers.push(`${label} -> rcode ${res.status}`)
      }
    }
    lines.push(`${type}:`)
    for (const a of answers) lines.push(`  ${a}`)
    if (answered) hits.push(type)
    lines.push("")
  }

  if (hits.length) {
    lines.push(
      `This zone answers for names that were never created, at least for ${hits.join(", ")}.`,
      "A wildcard record is why a mistyped or decommissioned hostname still resolves, and why a certificate can be issued for a name you never configured. If the answers are identical across probes, the records are a genuine wildcard rather than a coincidence.",
    )
  } else {
    const probed = WILDCARD_LABELS.length * types.length
    lines.push(
      `No wildcard detected. None of the ${probed} probe(s) returned an answer: ${nxdomain} NXDOMAIN, ${nodata} NODATA${other ? `, ${other} other` : ""}. All of those mean no record exists for a name that was never configured, which is the correct and safer behaviour.`,
      "If a name you expected to be gone still resolves, it is because a specific record for it still exists, not because the zone is wildcarded.",
    )
  }
  lines.push("", "Only four labels are probed, and some zones wildcard selectively by record type or by pattern, so a clean result is strong evidence rather than proof.")
  return lines.join("\n")
}
