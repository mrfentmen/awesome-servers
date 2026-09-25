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
