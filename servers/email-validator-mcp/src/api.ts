import { promises as dns } from "node:dns"

export class EmailError extends Error {}

/**
 * Throwaway-mail domains seen in signup fraud. Kept small on purpose so a
 * false positive is rare; the list is easy to extend.
 */
export const DISPOSABLE = new Set([
  "mailinator.com", "10minutemail.com", "guerrillamail.com", "sharklasers.com",
  "yopmail.com", "tempmail.com", "throwawaymail.com", "maildrop.cc", "temp-mail.org",
  "getnada.com", "dispostable.com", "mohmal.com", "emailondeck.com", "burnermail.io",
  "trashmail.com", "spam4.me", "fakeinbox.com", "mailnesia.com", "mintemail.com",
  "mailcatch.com", "mailnull.com", "spamgourmet.com", "tempr.email", "discard.email",
  "33mail.com", "mytemp.email", "tempinbox.com", "email-temp.com",
])

/** Shared/role mailboxes — deliverable, but usually not a real person. */
export const ROLE_LOCALPARTS = new Set([
  "info", "support", "sales", "admin", "administrator", "help", "contact", "billing",
  "accounts", "accounting", "hr", "jobs", "careers", "marketing", "press", "media",
  "noreply", "no-reply", "donotreply", "postmaster", "webmaster", "abuse", "security",
  "hello", "team", "office", "enquiries", "inquiries", "service", "customerservice",
])

const FREE_PROVIDERS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "outlook.com", "hotmail.com",
  "live.com", "msn.com", "aol.com", "icloud.com", "me.com", "mac.com", "proton.me",
  "protonmail.com", "gmx.com", "gmx.de", "yandex.com", "zoho.com", "mail.com", "qq.com",
  "163.com", "126.com", "web.de", "fastmail.com", "tutanota.com", "hey.com",
])

interface Result {
  email: string
  format: string
  domain: string
  localpart: string
  mx_hosts: string[]
  disposable: boolean
  free_provider: boolean
  role_account: boolean
  plus_tag: string | null
  deliverable: string
}

const LOCAL_RE = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+$/
const DOMAIN_RE = /^(?=.{1,253}$)([A-Za-z0-9](-*[A-Za-z0-9])*\.)+[A-Za-z]{2,}$/

async function checkOne(email: string): Promise<Result> {
  const trimmed = email.trim()
  const at = trimmed.lastIndexOf("@")
  const localpart = at > 0 ? trimmed.slice(0, at) : ""
  const domain = (at > 0 ? trimmed.slice(at + 1) : "").toLowerCase()

  const base: Result = {
    email: trimmed,
    format:
      at > 0 && localpart && LOCAL_RE.test(localpart) && !localpart.startsWith(".") &&
      !localpart.endsWith(".") && !localpart.includes("..") && DOMAIN_RE.test(domain)
        ? "valid"
        : "invalid",
    domain,
    localpart,
    mx_hosts: [],
    disposable: DISPOSABLE.has(domain),
    free_provider: FREE_PROVIDERS.has(domain),
    role_account: ROLE_LOCALPARTS.has(localpart.toLowerCase()),
    plus_tag: localpart.includes("+") ? localpart.slice(localpart.indexOf("+") + 1) : null,
    deliverable: "unknown",
  }

  if (base.format === "invalid") {
    base.deliverable = "not checked"
    return base
  }
  try {
    const hosts = await dns.resolveMx(domain)
    base.mx_hosts = hosts.sort((a, b) => a.priority - b.priority).map((h) => h.exchange)
    base.deliverable = base.mx_hosts.length > 0 ? "likely" : "no MX record"
  } catch {
    base.deliverable = "no MX record or domain not found"
  }
  return base
}

function fmt(r: Result): string {
  const flags = [
    r.format === "invalid" ? "INVALID FORMAT" : null,
    r.disposable ? "DISPOSABLE" : null,
    r.role_account ? "ROLE ACCOUNT" : null,
    r.free_provider ? "free provider" : null,
  ].filter(Boolean)
  return (
    `${r.email}\n` +
    `  Format: ${r.format}\n` +
    `  Domain: ${r.domain}\n` +
    `  MX: ${r.mx_hosts.slice(0, 5).join(", ") || "none"}\n` +
    `  Deliverable: ${r.deliverable}${flags.length ? ` | ${flags.join(" | ")}` : ""}` +
    (r.plus_tag ? `\n  Plus tag: +${r.plus_tag}` : "")
  )
}

export async function validateEmail(args: { email?: string }): Promise<string> {
  const email = (args.email ?? "").trim()
  if (!email) throw new EmailError("Provide an email address")
  return fmt(await checkOne(email))
}

export async function validateBatch(args: { emails?: string }): Promise<string> {
  const list = (args.emails ?? "").split(/[,\s]+/).map((e) => e.trim()).filter(Boolean)
  if (list.length === 0) throw new EmailError("Provide at least one email address")
  const results = await Promise.all(list.slice(0, 25).map(checkOne))
  const valid = results.filter((r) => r.format === "valid").length
  const risky = results.filter((r) => r.disposable || r.role_account).length
  return (
    `${results.length} address(es): ${valid} well-formed, ${results.length - valid} malformed, ${risky} flagged (disposable or role).\n\n` +
    results.map(fmt).join("\n\n")
  )
}

/** Domain-level check: MX plus A record and disposable status, no address needed. */
export async function checkDomain(args: { domain?: string }): Promise<string> {
  const domain = (args.domain ?? "").trim().toLowerCase().replace(/^@/, "")
  if (!domain) throw new EmailError("Provide a domain, e.g. 'example.com'")
  if (!DOMAIN_RE.test(domain)) throw new EmailError(`"${domain}" is not a valid domain name`)

  const [mx, a] = await Promise.all([
    dns.resolveMx(domain).catch(() => [] as Array<{ priority: number; exchange: string }>),
    dns.resolve4(domain).catch(() => [] as string[]),
  ])
  const sorted = mx.sort((x, y) => x.priority - y.priority)
  const lines = [
    `Domain: ${domain}`,
    `Accepts mail: ${sorted.length > 0 ? "yes" : "NO — no MX record, addresses here will bounce"}`,
    `MX records (${sorted.length}):`,
    ...(sorted.length ? sorted.map((m) => `  ${m.priority} ${m.exchange}`) : ["  none"]),
    `A records (${a.length}): ${a.slice(0, 4).join(", ") || "none"}`,
    `Disposable provider: ${DISPOSABLE.has(domain) ? "YES" : "no"}`,
    `Free mail provider: ${FREE_PROVIDERS.has(domain) ? "yes" : "no"}`,
  ]
  return lines.join("\n")
}

/** Canonical form of an address, plus the variants providers will also accept. */
export function normalizeEmail(args: { email?: string }): string {
  const raw = (args.email ?? "").trim()
  if (!raw) throw new EmailError("Provide an email address")
  const at = raw.lastIndexOf("@")
  if (at <= 0) throw new EmailError(`"${raw}" has no @, so it cannot be normalised`)
  const local = raw.slice(0, at)
  const domain = raw.slice(at + 1).toLowerCase()
  const withoutTag = local.split("+")[0]
  // Gmail and Googlemail ignore dots in the local part.
  const isGoogle = domain === "gmail.com" || domain === "googlemail.com"
  const canonicalLocal = isGoogle ? withoutTag.replace(/\./g, "") : withoutTag
  const canonical = `${canonicalLocal}@${domain === "googlemail.com" ? "gmail.com" : domain}`
  const variants = new Set<string>([raw.toLowerCase(), `${local.toLowerCase()}@${domain}`, canonical])
  return [
    `Input:     ${raw}`,
    `Normalised: ${canonical}`,
    `Local part: ${local}${args.email?.includes("+") ? " (has a plus tag)" : ""}`,
    `Domain:     ${domain}`,
    "",
    "Equivalent forms:",
    ...[...variants].map((v) => `  ${v}`),
  ].join("\n")
}

/** Pull every email address out of a blob of text. */
export function extractEmails(args: { text?: string }): string {
  const body = args.text ?? ""
  if (!body.trim()) throw new EmailError("Provide some text to scan")
  const found = body.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) ?? []
  const unique = [...new Set(found.map((e) => e.replace(/[.,;:]+$/, "")))]
  if (!unique.length) return "No email addresses found in that text."
  const junk = unique.filter((e) => DISPOSABLE.has(e.split("@")[1]?.toLowerCase() ?? ""))
  return (
    `Found ${unique.length} unique address(es):\n` +
    unique.map((e) => `  ${e}`).join("\n") +
    (junk.length ? `\n\nFlagged as disposable (${junk.length}): ${junk.join(", ")}` : "")
  )
}

/** The disposable-domain list this server checks against. */
export function disposableDomains(args: { limit?: number }): string {
  const limit = Math.min(Math.max(Number(args.limit) || 40, 1), DISPOSABLE.size)
  const all = [...DISPOSABLE].sort()
  return (
    `${DISPOSABLE.size} known disposable domains, showing ${Math.min(limit, all.length)}:\n` +
    all.slice(0, limit).map((d, i) => `${i + 1}. ${d}`).join("\n")
  )
}
// ---- batch-4 tools: auth records, MX health, typo help (2026-09-27) ----
const DKIM_SELECTORS = ["default", "google", "selector1", "selector2", "k1", "mail", "dkim"]

const txtOf = (name: string) =>
  dns.resolveTxt(name).then((rows) => rows.map((parts) => parts.join(""))).catch(() => [] as string[])

/** The full anti-spoofing picture: MX hosts, SPF, DMARC policy and DKIM selectors. */
export async function emailAuthRecords(args: { domain?: string }): Promise<string> {
  const domain = (args.domain ?? "").trim().toLowerCase().replace(/^@/, "")
  if (!domain) throw new EmailError("Provide a domain, e.g. 'example.com'")
  if (!DOMAIN_RE.test(domain)) throw new EmailError(`"${domain}" is not a valid domain name`)
  const [root, dmarc, mx] = await Promise.all([
    txtOf(domain),
    txtOf(`_dmarc.${domain}`),
    dns.resolveMx(domain).catch(() => [] as Array<{ priority: number; exchange: string }>),
  ])
  const spf = root.find((t) => t.toLowerCase().startsWith("v=spf1"))
  const dmarcRecord = dmarc.find((t) => t.toLowerCase().startsWith("v=dmarc1"))
  const dkim: string[] = []
  for (const selector of DKIM_SELECTORS) {
    const rows = await txtOf(`${selector}._domainkey.${domain}`)
    if (rows.some((r) => /v=dkim1|k=rsa|p=/i.test(r))) dkim.push(selector)
  }
  const policy = dmarcRecord?.match(/p=(none|quarantine|reject)/i)?.[1] ?? null
  const allRule = spf?.match(/([-~?])all/)?.[1] ?? null
  const allNote =
    allRule === "-" ? " - hard fail, unauthorised senders are rejected" :
    allRule === "~" ? " - soft fail, unauthorised senders are marked" :
    allRule === "?" ? " - neutral, unauthorised senders are allowed" : ""
  return [
    `Mail authentication for ${domain}`,
    `MX hosts (${mx.length}): ${mx.length ? mx.sort((a, b) => a.priority - b.priority).map((m) => m.exchange).join(", ") : "none - the domain cannot receive mail"}`,
    `SPF: ${spf ?? "missing"}${allRule ? `  (all rule "${allRule}all"${allNote})` : ""}`,
    `DMARC: ${dmarcRecord ?? "missing"}${policy ? `  (policy ${policy.toUpperCase()})` : ""}`,
    `DKIM selectors found: ${dkim.length ? dkim.join(", ") : `none at ${DKIM_SELECTORS.join(", ")}`}`,
    "",
    spf && dmarcRecord && policy && policy !== "none" && dkim.length
      ? "SPF, DMARC and DKIM are all in place."
      : "Gaps above are what let spoofed mail through; fix them at the DNS host.",
  ].join("\n")
}

/** Every MX host, whether it resolves, and its reverse DNS. */
export async function mxHealth(args: { domain?: string }): Promise<string> {
  const domain = (args.domain ?? "").trim().toLowerCase().replace(/^@/, "")
  if (!domain) throw new EmailError("Provide a domain, e.g. 'example.com'")
  if (!DOMAIN_RE.test(domain)) throw new EmailError(`"${domain}" is not a valid domain name`)
  const mx = await dns.resolveMx(domain).catch(() => [] as Array<{ priority: number; exchange: string }>)
  if (!mx.length) return `${domain} has no MX record, so it cannot receive mail. Add one at the DNS host.`
  const rows: string[] = []
  let unreachable = 0
  for (const record of mx.sort((a, b) => a.priority - b.priority).slice(0, 10)) {
    const host = record.exchange.replace(/\.$/, "")
    const [addresses, ptr] = await Promise.all([
      dns.resolve4(host).catch(() => [] as string[]),
      dns.reverse(host).catch(() => [] as string[]),
    ])
    if (!addresses.length) unreachable += 1
    rows.push(
      `${String(record.priority).padStart(3)} ${host} | ${addresses.length ? `A ${addresses.slice(0, 2).join(", ")}` : "NO A record - mail routed here will fail"}${ptr.length ? ` | PTR ${ptr[0]}` : ""}`
    )
  }
  return [
    `MX health for ${domain}: ${mx.length} host(s), ${unreachable ? `${unreachable} without an A record` : "all resolve"}`,
    "",
    ...rows,
    "",
    unreachable ? "Fix the hosts that do not resolve before mail starts bouncing." : "Every MX host resolves, so mail has a route in.",
  ].join("\n")
}

const KNOWN_DOMAINS = [...new Set([...FREE_PROVIDERS, "zoho.com", "yandex.com", "gmx.de", "web.de", "fastmail.com", "hey.com", "qq.com", "163.com"])]

const editDistance = (a: string, b: string): number => {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)])
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
    }
  }
  return dp[a.length][b.length]
}

/** Suggests the provider a mistyped domain was probably meant to be. Nothing is sent anywhere. */
export function correctTypo(args: { email?: string }): string {
  const raw = (args.email ?? "").trim()
  if (!raw) throw new EmailError("Provide an email address to check")
  const at = raw.lastIndexOf("@")
  if (at <= 0) throw new EmailError(`"${raw}" has no @, so there is nothing to correct`)
  const local = raw.slice(0, at)
  const domain = raw.slice(at + 1).toLowerCase()
  if (KNOWN_DOMAINS.includes(domain)) {
    return `${raw} uses ${domain}, a known mail provider - no correction suggested.`
  }
  const best = KNOWN_DOMAINS
    .map((candidate) => ({ candidate, distance: editDistance(domain, candidate) }))
    .sort((a, b) => a.distance - b.distance)[0]
  if (!best || best.distance > 2) {
    return `No close match for the domain "${domain}" - it may be a real domain. Run check_domain to test whether it accepts mail.`
  }
  return [
    `Possible typo in "${domain}"`,
    `Closest known provider: ${best.candidate} (edit distance ${best.distance})`,
    `Suggested address: ${local}@${best.candidate}`,
    "",
    "Suggestion only - the domain was not contacted.",
  ].join("\n")
}

// ---- muxD tools:
import { promises as dnsPromises } from "node:dns"
import { createConnection } from "node:net"

const EDGE_LOCALPARTS = new Set(["postmaster", "abuse", "hostmaster", "webmaster", "noc", "security", "hostmaster", "postmaster"])
const GIT_HOSTING = new Set(["github.com", "gitlab.com", "bitbucket.org", "codeberg.org", "gitea.com", "sourcehut.org"])

/**
 * RFC 5321 verification by SMTP. The existence of the *domain's* MX says nothing
 * about whether one address is real, so the only way to tell is to ask the
 * receiving server. A network failure must never be reported as "no such
 * mailbox", which is why every failure mode is returned as a distinct string
 * rather than collapsed into a boolean.
 */
type RcptResult =
  | { kind: "exists"; code: number; text: string }
  | { kind: "absent"; code: number; text: string }
  | { kind: "defer"; code: number; text: string }
  | { kind: "neutral"; code: number; text: string }
  | { kind: "unreachable"; code: number; text: string }

export interface SmtpMailboxCheckArgs {
  email: string;
  check_catch_all?: boolean;
  timeout_ms?: number;
}

/** RFC 7208 evaluation state. `explain` carries the chain that produced the verdict. */
interface SpfEval {
  result: "pass" | "fail" | "softfail" | "neutral" | "none" | "permerror" | "temperror"
  domain: string
  explain: string[]
  lookups: number
}

export interface SpfEvaluateArgs {
  domain: string;
  ip: string;
  include_record?: boolean;
}

export interface AliasVariantsArgs {
  email: string;
  max?: number;
}

/** Purely local: derives the plus-tag and dot-stripped forms of an address so alias-based duplicates can be spotted. */
export async function aliasVariants(args: AliasVariantsArgs): Promise<string> {
  const email = String(args.email ?? "").trim().toLowerCase()
  if (!email) throw new EmailError("Provide an email address, e.g. 'someone+news@example.com'")
  const at = email.lastIndexOf("@")
  if (at <= 0 || at === email.length - 1) throw new EmailError(`"${email}" is not an address`)
  const localRaw = email.slice(0, at)
  const domain = email.slice(at + 1)
  if (!DOMAIN_RE.test(domain)) throw new EmailError(`"${domain}" is not a valid domain name`)
  if (!LOCAL_RE.test(localRaw)) throw new EmailError(`"${localRaw}" contains characters that are not valid in a local part`)

  const max = Math.min(Math.max(Math.floor(args.max ?? 40) || 40, 1), 200)
  const set = new Set<string>()
  const add = (s: string) => { if (s && s !== email && s.length <= 64) set.add(s) }

  const plusIdx = localRaw.indexOf("+")
  const base = plusIdx === -1 ? localRaw : localRaw.slice(0, plusIdx)
  const tag = plusIdx === -1 ? null : localRaw.slice(plusIdx + 1)

  if (tag) {
    add(`${base}@${domain}`)
    // The tag is a routing label, so every plausible reading of it is a
    // different mailbox that reaches the same person.
    for (const part of tag.split(/[._-]+/).filter(Boolean).slice(0, 6)) {
      add(`${base}+${part}@${domain}`)
      add(`${base}+${part.toUpperCase()}@${domain}`)
    }
  }

  // Gmail and a handful of others ignore dots in the local part, so these all
  // resolve to the same mailbox. Almost no other provider does this.
  const dotInsensitive = new Set(["gmail.com", "googlemail.com"])
  if (dotInsensitive.has(domain) && base.includes(".")) {
    add(`${base.replace(/\./g, "")}@${domain}`)
    if (base.replace(/\./g, "").length > 0) add(`${base.split(".")[0]}@${domain}`)
  }
  if (domain === "googlemail.com") add(`${base}@gmail.com`)
  if (domain === "gmail.com") add(`${base}@googlemail.com`)

  // Fastmail-style plus addressing is a documented feature, not a provider quirk.
  if (["fastmail.com", "fastmail.fm", "migumail.com", "runbox.com", "hushmail.com", "tutanota.com", "zoho.com", "yandex.com", "hey.com", "icloud.com", "outlook.com", "proton.me", "protonmail.com", "fastmail.ch"].includes(domain)) {
    add(`${base}+${tag ?? "unused"}@${domain}`)
  }

  const out = [...set].slice(0, max)

  const isRole = EDGE_LOCALPARTS.has(base) || ROLE_LOCALPARTS.has(base)
  const isFree = FREE_PROVIDERS.has(domain)
  const isHosting = GIT_HOSTING.has(domain)

  const lines = [
    `Alias analysis for ${email}`,
    `canonical-looking local part: ${base}${tag !== null ? `  (plus tag "${tag}" stripped)` : ""}`,
    `domain: ${domain}  ${isFree ? "- a free consumer provider, where addresses are cheap to create in bulk" : ""}${isHosting ? "- a code-hosting domain, often a forge login rather than a person" : ""}`,
    "",
  ]
  if (isRole) {
    lines.push(
      `"${base}" is a role address, not a person. Role mailboxes are accepted by mail servers and always accept an SMTP probe, so an SMTP existence check will pass for one and it should not be read as a deliverable individual.`,
      "",
    )
  }
  if (isFree) {
    lines.push("Free providers hand out addresses freely, so a valid address from one is weak evidence that anyone chose it deliberately.", "")
  }
  if (isHosting) {
    lines.push("On a code-hosting domain the address is usually a forge account, so a signup there is not a personal mailbox and often is not intended to receive mail.", "")
  }

  lines.push(`${out.length} variant(s) that reach the same person or the same inbox:`)
  for (const v of out.slice(0, 20)) lines.push(`  ${v}`)
  if (out.length > 20) lines.push(`  ...and ${out.length - 20} more`)
  if (!out.length) lines.push("  none: there is no plus tag, no dot-insensitive provider and no alias feature to expand")

  lines.push(
    "",
    "Whether these are the same person cannot be decided from the address. Only a provider that documents alias collapsing, such as Gmail ignoring dots or Fastmail accepting plus tags, will treat them as identical; everywhere else plus is a real, separate mailbox.",
  )
  return lines.join("\n")
}
