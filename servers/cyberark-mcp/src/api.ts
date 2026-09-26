import { createHash, randomInt } from "node:crypto"

const UA = "mrfentmen-cyberark-mcp/1.0"
const PWNED = "https://api.pwnedpasswords.com"
const HIBP = "https://haveibeenpwned.com/api/v3"
const DOH = "https://dns.google/resolve"

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

/**
 * Checks a password against the Have I Been Pwned range API using k-anonymity:
 * only the first five characters of the SHA-1 hash ever leave this server, and
 * the full password is never sent or logged.
 */
async function pwnedCount(password: string): Promise<number> {
  if (!password) throw new Error("Provide the password to check.")
  const hash = createHash("sha1").update(password, "utf8").digest("hex").toUpperCase()
  const prefix = hash.slice(0, 5)
  const suffix = hash.slice(5)
  const res = await fetch(`${PWNED}/range/${prefix}`, {
    headers: { "User-Agent": UA, "Add-Padding": "true" },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`Have I Been Pwned returned HTTP ${res.status}.`)
  const body = await res.text()
  for (const line of body.split(/\r?\n/)) {
    const [candidate, count] = line.split(":")
    if (candidate?.trim().toUpperCase() === suffix) return Number(count) || 0
  }
  return 0
}

export async function checkPassword(args: { password: string }): Promise<string> {
  const count = await pwnedCount(args.password)
  const lines = count > 0
    ? [
      `BREACHED — this password appears in ${count.toLocaleString("en-US")} known data breach record(s).`,
      "Do not use it. Attackers try these first and it is not safe for any account.",
    ]
    : [
      "Not found in any known breach.",
      "It has not appeared in a public data breach dump. Pair it with a unique password per site.",
    ]
  return [
    `Password breach check`,
    `Only the first 5 characters of the SHA-1 hash were sent (k-anonymity), never the password itself.`,
    "",
    ...lines,
  ].join("\n")
}

export async function checkPasswords(args: { passwords: string[] }): Promise<string> {
  const list = (args.passwords ?? []).map((p) => String(p)).filter(Boolean).slice(0, 10)
  if (!list.length) return "Provide up to 10 passwords to check."
  const rows: string[] = []
  let breached = 0
  // Sequential so a burst of requests does not get rate limited.
  for (let i = 0; i < list.length; i += 1) {
    const count = await pwnedCount(list[i])
    if (count > 0) breached += 1
    rows.push(`#${i + 1}: ${count > 0 ? `BREACHED (${count.toLocaleString("en-US")} record(s))` : "not in any breach"}`)
  }
  return [
    `Checked ${list.length} password(s): ${breached} already breached.`,
    "Passwords are never stored or echoed — each is hashed and only its 5-character hash prefix is sent.",
    "",
    ...rows,
  ].join("\n")
}

const COMMON_WORDS = [
  "password", "letmein", "welcome", "admin", "qwerty", "iloveyou", "monkey", "dragon",
  "football", "baseball", "sunshine", "princess", "login", "abc123", "changeme", "secret",
  "summer", "winter", "spring", "autumn", "shadow", "master", "freedom", "whatever",
  "michael", "jordan", "superman", "trustno1", "starwars", "computer", "internet",
]

const KEYBOARD_RUNS = ["qwertyuiop", "asdfghjkl", "zxcvbnm", "1234567890"]

function humanDuration(seconds: number): string {
  if (seconds < 1) return "less than a second"
  const units: Array<[string, number]> = [
    ["year", 31557600], ["day", 86400], ["hour", 3600], ["minute", 60], ["second", 1],
  ]
  for (const [name, size] of units) {
    const value = seconds / size
    if (value >= 1) {
      const rounded = Math.round(value)
      return `${rounded.toLocaleString("en-US")} ${name}${rounded === 1 ? "" : "s"}`
    }
  }
  return "less than a second"
}

export interface StrengthResult {
  length: number
  classes: number
  entropyBits: number
  crackSeconds: number
  findings: string[]
  verdict: string
}

/** Scores a password locally. Nothing is transmitted. */
export function analyzeStrength(password: string): StrengthResult {
  const value = password ?? ""
  const length = value.length
  const findings: string[] = []

  const hasLower = /[a-z]/.test(value)
  const hasUpper = /[A-Z]/.test(value)
  const hasDigit = /\d/.test(value)
  const hasSymbol = /[^A-Za-z0-9]/.test(value)
  const classes = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length

  let alphabet = 0
  if (hasLower) alphabet += 26
  if (hasUpper) alphabet += 26
  if (hasDigit) alphabet += 10
  if (hasSymbol) alphabet += 33

  let entropyBits = alphabet > 0 ? length * Math.log2(alphabet) : 0

  if (length < 12) findings.push(`Only ${length} character(s) — use at least 12, ideally 16 or a passphrase.`)
  if (classes < 3) findings.push(`Uses ${classes} character type(s) — mix upper case, lower case, digits and symbols.`)
  if (/(.)\1{2,}/.test(value)) findings.push("Repeats the same character three or more times.")
  if (/(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def)/i.test(value)) findings.push("Contains a straight sequence like 123 or abc.")
  const lowerValue = value.toLowerCase()
  for (const run of KEYBOARD_RUNS) {
    for (let i = 0; i + 4 <= run.length; i += 1) {
      const chunk = run.slice(i, i + 4)
      if (lowerValue.includes(chunk)) {
        findings.push(`Contains the keyboard pattern "${chunk}".`)
        break
      }
    }
  }
  const matchedWord = COMMON_WORDS.find((word) => lowerValue.includes(word))
  if (matchedWord) findings.push(`Contains the common word "${matchedWord}".`)
  const hasYear = /(19|20)\d{2}/.test(value)
  if (hasYear) findings.push("Contains a four-digit year, which is easy to guess.")
  const capitalisedPlus = /^[A-Z][a-z]{3,}[\d!@#$%^&*.]{1,6}$/.test(value)
  if (capitalisedPlus) findings.push("Looks like a capitalised word plus digits or symbols — a pattern cracking tools try early.")
  const keyboardRun = KEYBOARD_RUNS.some((run) => lowerValue.includes(run.slice(0, 4)))
  const sequence = /(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def)/i.test(value)

  if (matchedWord || keyboardRun || sequence || hasYear || capitalisedPlus) {
    // Dictionary words, keyboard walks, sequences and years collapse the search
    // space, so bill those passwords far below the raw alphabet product.
    entropyBits = Math.min(entropyBits, length * 3)
  }

  // 10 billion guesses per second: a modern offline attack on a fast hash.
  const guesses = Math.pow(2, Math.max(entropyBits, 1))
  const crackSeconds = guesses / 1e10

  const verdict = crackSeconds > 31557600 * 100
    ? "Strong"
    : crackSeconds > 31557600
      ? "Reasonable"
      : crackSeconds > 86400
        ? "Weak"
        : "Very weak"

  return { length, classes, entropyBits: Math.round(entropyBits), crackSeconds, findings, verdict }
}

export async function passwordStrength(args: { password: string }): Promise<string> {
  const r = analyzeStrength(args.password)
  return [
    "Password strength analysis (computed locally, never sent anywhere)",
    `Verdict: ${r.verdict}`,
    `Length: ${r.length} character(s) | Character types used: ${r.classes} of 4`,
    `Estimated entropy: ${r.entropyBits} bits`,
    `Offline crack time at 10 billion guesses/second: ${humanDuration(r.crackSeconds)}`,
    "",
    r.findings.length
      ? `Issues found (${r.findings.length}):\n${r.findings.map((f) => `  - ${f}`).join("\n")}`
      : "No obvious weaknesses found.",
  ].join("\n")
}

const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.?/"

export async function generatePassword(args: {
  length?: number
  symbols?: boolean
  digits?: boolean
  upperCase?: boolean
}): Promise<string> {
  const length = Math.min(Math.max(Number(args.length ?? 20) || 20, 8), 128)
  const pools: string[] = ["abcdefghijkmnopqrstuvwxyz"]
  if (args.upperCase !== false) pools.push("ABCDEFGHJKLMNPQRSTUVWXYZ")
  if (args.digits !== false) pools.push("23456789")
  if (args.symbols !== false) pools.push(SYMBOLS)

  const all = pools.join("")
  const chars: string[] = []
  // One character from every pool first, so the result always uses each class.
  for (const pool of pools) {
    if (chars.length >= length) break
    chars.push(pool[randomInt(0, pool.length)])
  }
  while (chars.length < length) chars.push(all[randomInt(0, all.length)])
  // Shuffle with a cryptographic random source so the required characters are not first.
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i + 1)
    const tmp = chars[i]
    chars[i] = chars[j]
    chars[j] = tmp
  }

  const password = chars.join("")
  const r = analyzeStrength(password)
  return [
    "Generated password (from a cryptographically secure random source)",
    "",
    password,
    "",
    `Length: ${length} | Character classes: ${r.classes} of 4 | Entropy: ${r.entropyBits} bits`,
    `Offline crack time: ${humanDuration(r.crackSeconds)}`,
    "Store it in a secret manager, not in a document or chat.",
  ].join("\n")
}

interface Breach {
  Name: string
  Title: string
  Domain: string
  BreachDate: string
  AddedDate: string
  PwnCount: number
  DataClasses: string[]
  IsVerified: boolean
  IsSensitive: boolean
}

export async function breachCatalog(args: { domain?: string; year?: number; limit?: number }): Promise<string> {
  const res = await fetch(`${HIBP}/breaches`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`Have I Been Pwned returned HTTP ${res.status}.`)
  let breaches = (await res.json()) as Breach[]

  if (args.domain) {
    const wanted = args.domain.trim().toLowerCase()
    breaches = breaches.filter((b) => (b.Domain ?? "").toLowerCase().includes(wanted))
  }
  if (args.year) {
    breaches = breaches.filter((b) => b.BreachDate?.startsWith(String(args.year)))
  }
  breaches = breaches.filter((b) => !b.IsSensitive)
  breaches.sort((a, b) => b.PwnCount - a.PwnCount)

  const limit = Math.min(Math.max(Number(args.limit ?? 15) || 15, 1), 100)
  const shown = breaches.slice(0, limit)
  const lines = [
    `Breach catalogue${args.domain ? ` for "${args.domain}"` : ""}${args.year ? ` in ${args.year}` : ""} — ${breaches.length} matching breach(es), largest first`,
    "Source: Have I Been Pwned, which aggregates publicly disclosed breaches.",
    "",
  ]
  shown.forEach((b, i) => {
    lines.push(`${i + 1}. ${b.Title} (${b.Domain || "no domain"})`)
    lines.push(`   breached ${b.BreachDate} | ${b.PwnCount.toLocaleString("en-US")} accounts | data: ${(b.DataClasses ?? []).join(", ")}`)
  })
  if (!shown.length) lines.push("No breaches matched those filters.")
  return lines.join("\n")
}

export async function breachDetail(args: { name: string }): Promise<string> {
  const name = (args.name ?? "").trim()
  if (!name) return "Provide a breach name such as LinkedIn or Adobe."
  const res = await fetch(`${HIBP}/breach/${encodeURIComponent(name)}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 404) return `No breach named "${name}" is in the Have I Been Pwned catalogue.`
  if (!res.ok) throw new Error(`Have I Been Pwned returned HTTP ${res.status}.`)
  const b = (await res.json()) as Breach
  return [
    `Breach: ${b.Title}`,
    `Domain: ${b.Domain || "not disclosed"}`,
    `Breach date: ${b.BreachDate}`,
    `Added to the catalogue: ${b.AddedDate?.slice(0, 10) ?? "unknown"}`,
    `Accounts exposed: ${b.PwnCount.toLocaleString("en-US")}`,
    `Verified by the site: ${b.IsVerified ? "yes" : "no"}`,
    `Data classes: ${(b.DataClasses ?? []).join(", ")}`,
    "",
    (b as unknown as { Description?: string }).Description?.replace(/<[^>]+>/g, "").slice(0, 1200) ?? "",
  ].filter(Boolean).join("\n")
}

const TYPE_NAMES: Record<number, string> = {
  1: "A", 2: "NS", 5: "CNAME", 15: "MX", 16: "TXT", 257: "CAA",
}

interface DohResponse { Status?: number; Answer?: Array<{ type?: number; data?: string }> }

async function dns(name: string, type: string): Promise<DohResponse> {
  const res = await fetch(`${DOH}?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`, {
    headers: { "User-Agent": UA, Accept: "application/dns-json" },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`DNS-over-HTTPS returned HTTP ${res.status}.`)
  return (await res.json()) as DohResponse
}

const records = (d: DohResponse, type: string): string[] =>
  (d.Answer ?? [])
    .filter((row) => TYPE_NAMES[row.type ?? 0] === type)
    // TXT answers arrive wrapped in quotes; CAA answers start with a flag digit and
    // must keep their inner quotes, so only strip a pair that wraps the whole value.
    .map((row) => String(row.data ?? "").trim().replace(/^"([\s\S]*)"$/, "$1"))

const DKIM_SELECTORS = ["default", "google", "selector1", "selector2", "k1", "mail", "dkim"]

export async function domainEmailSecurity(args: { domain: string }): Promise<string> {
  const raw = (args.domain ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "")
  if (!raw || !raw.includes(".")) return "Provide a domain like example.com."

  const [spfRes, dmarcRes, mxRes, caaRes] = await Promise.all([
    dns(raw, "TXT"),
    dns(`_dmarc.${raw}`, "TXT"),
    dns(raw, "MX"),
    dns(raw, "CAA"),
  ])

  const spf = records(spfRes, "TXT").find((r) => r.startsWith("v=spf1"))
  const dmarc = records(dmarcRes, "TXT").find((r) => r.startsWith("v=DMARC1"))
  const mx = records(mxRes, "MX")
  const caa = records(caaRes, "CAA")

  const dkimHits: string[] = []
  for (const selector of DKIM_SELECTORS) {
    const res = await dns(`${selector}._domainkey.${raw}`, "TXT")
    if (records(res, "TXT").some((r) => /v=DKIM1|k=rsa|p=/.test(r))) dkimHits.push(selector)
  }

  const checks: Array<[string, boolean, string]> = [
    ["SPF record", Boolean(spf), spf ?? "missing — anyone can send mail claiming to be this domain"],
    ["DMARC policy", Boolean(dmarc), dmarc ?? "missing — receiving servers have no instruction for spoofed mail"],
    ["DKIM signing", dkimHits.length > 0, dkimHits.length ? `published selectors: ${dkimHits.join(", ")}` : `no key found at common selectors (${DKIM_SELECTORS.join(", ")})`],
    ["MX records", mx.length > 0, mx.length ? `${mx.length} mail host(s)` : "no MX record — the domain cannot receive mail"],
    ["CAA record", caa.length > 0, caa.length ? caa.join(" | ") : "missing — any certificate authority may issue certificates for this domain"],
  ]

  const passing = checks.filter(([, ok]) => ok).length
  const grade = passing === 5 ? "A" : passing === 4 ? "B" : passing === 3 ? "C" : passing === 2 ? "D" : "F"

  return [
    `Email and identity security for ${raw}`,
    `Grade: ${grade} — ${passing} of ${checks.length} controls in place`,
    "",
    ...checks.map(([name, ok, detail]) => `${ok ? "PASS" : "MISS"} ${name}\n     ${detail}`),
    "",
    spf && /[-~?]all/.test(spf)
      ? `SPF enforcement: "${spf.match(/[-~?]all/)?.[0]}" (${spf.includes("-all") ? "rejects unauthorised senders" : spf.includes("~all") ? "soft-fails unauthorised senders" : "allows unauthorised senders"})`
      : "",
    dmarc && /p=(none|quarantine|reject)/.test(dmarc)
      ? `DMARC policy: ${dmarc.match(/p=(none|quarantine|reject)/)?.[1]}`
      : "",
  ].filter(Boolean).join("\n")
}
