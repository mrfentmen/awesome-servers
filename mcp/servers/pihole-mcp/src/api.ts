/**
 * Pi-hole API client (v6 REST). Points at any instance via PIHOLE_URL
 * (default http://localhost:80). Auth with PIHOLE_PASSWORD (web password)
 * or PIHOLE_APP_PASSWORD (Settings > Web interface > App password).
 * Docs: https://docs.pi-hole.net/api/
 */
const BASE = (process.env.PIHOLE_URL ?? "http://localhost:80").replace(/\/+$/, "")

export class PiholeError extends Error {}

let sid: string | null = null

async function session(): Promise<string> {
  if (sid) return sid
  const password = process.env.PIHOLE_PASSWORD ?? process.env.PIHOLE_APP_PASSWORD
  if (!password) throw new PiholeError("Set PIHOLE_PASSWORD (or PIHOLE_APP_PASSWORD).")
  const res = await fetch(`${BASE}/api/auth`, {
    method: "POST",
    headers: { "User-Agent": "pihole-mcp/1.0", "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new PiholeError(`Pi-hole login failed (${res.status}). Check URL and password.`)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await res.json()) as any
  const id = data?.session?.sid
  if (!id) throw new PiholeError("Pi-hole login returned no session.")
  sid = id
  return sid as string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "pihole-mcp/1.0", Accept: "application/json", sid: await session() },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) {
    sid = null
    throw new PiholeError("Pi-hole refused (401/403). Check password.")
  }
  if (res.status === 404) throw new PiholeError("Not found. Check PIHOLE_URL (needs Pi-hole v6+).")
  if (!res.ok) throw new PiholeError(`Pi-hole error ${res.status}`)
  return (await res.json()) as T
}

async function postJson<T>(path: string, body: Raw = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "User-Agent": "pihole-mcp/1.0", Accept: "application/json", "Content-Type": "application/json", sid: await session() },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) {
    sid = null
    throw new PiholeError("Pi-hole refused (401/403). Check password.")
  }
  if (!res.ok) throw new PiholeError(`Pi-hole error ${res.status}`)
  return (await res.json()) as T
}

export async function blockingStatus(): Promise<string> {
  const d = await getJson<Raw>("/api/dns/blocking")
  return `Blocking is ${d.blocking === true ? "ENABLED" : d.blocking === false ? "DISABLED" : String(d.blocking ?? "?")}${d.timer ? ` (timer: ${d.timer}s)` : ""}`
}

export async function setBlocking(enabled: boolean, seconds = 0): Promise<string> {
  await postJson<Raw>("/api/dns/blocking", { blocking: enabled, timer: seconds > 0 ? seconds : null })
  return seconds > 0
    ? `Blocking ${enabled ? "enabled" : "disabled"} for ${seconds}s.`
    : `Blocking ${enabled ? "enabled" : "disabled"}.`
}

export async function summaryStats(): Promise<string> {
  const d = await getJson<Raw>("/api/stats/summary")
  const q = (d.queries ?? {}) as Raw
  const lines = [
    `DNS queries (24h): ${(q.total ?? "?").toLocaleString?.() ?? q.total ?? "?"}`,
    `Blocked: ${(q.blocked ?? "?").toLocaleString?.() ?? q.blocked ?? "?"}${q.percent_blocked !== undefined ? ` (${q.percent_blocked}%)` : ""}`,
    `Blocklist size: ${(d.gravity?.domains_being_blocked ?? "?").toLocaleString?.() ?? d.gravity?.domains_being_blocked ?? "?"}`,
    `Clients: ${d.clients?.active ?? "?"}`,
  ]
  return lines.join("\n")
}

// ---- muxB tools:

const PHOLE_FORUM = "https://discourse.pi-hole.net"

interface PiholeRule {
  raw: string
  kind: "adblock" | "exception" | "regex" | "hosts" | "domain" | "only" | "other"
  host: string
  subdomains: boolean
  modifiers: string
  address?: string
  pattern?: RegExp
  invalid?: string
}

/** Split a pasted blocklist into parsed rules, skipping comments and blanks. */
function piholeParseRules(text: string): { rules: PiholeRule[]; skipped: number } {
  const rules: PiholeRule[] = []
  let skipped = 0
  for (const line of String(text ?? "").split(/\r?\n/).slice(0, 5000)) {
    const row = line.trim()
    if (!row || row.startsWith("#") || row.startsWith("!")) {
      skipped++
      continue
    }
    if (row.startsWith("@@||")) {
      rules.push({ raw: row, kind: "exception", host: row.slice(4).split("^")[0].toLowerCase(), subdomains: true, modifiers: row.includes("$") ? row.slice(row.indexOf("$") + 1) : "" })
      continue
    }
    if (row.startsWith("||")) {
      const body = row.slice(2)
      const host = body.split("^")[0].split("$")[0].toLowerCase()
      rules.push({ raw: row, kind: "adblock", host, subdomains: true, modifiers: body.includes("$") ? body.slice(body.indexOf("$") + 1) : "" })
      continue
    }
    if (row.startsWith("/") && row.length > 2) {
      const end = row.lastIndexOf("/")
      const body = row.slice(1, end > 0 ? end : undefined)
      try {
        rules.push({ raw: row, kind: "regex", host: "", subdomains: false, modifiers: row.slice(end > 0 ? end + 1 : 0), pattern: new RegExp(body) })
      } catch (e) {
        rules.push({ raw: row, kind: "regex", host: "", subdomains: false, modifiers: "", invalid: e instanceof Error ? e.message : String(e) })
      }
      continue
    }
    if (row.startsWith("address=/")) {
      const inner = row.slice("address=/".length).split("/")[0]
      const parts = inner.split("/")
      rules.push({ raw: row, kind: "only", host: (parts[1] ?? "").toLowerCase(), subdomains: true, modifiers: parts[2] ?? "" })
      continue
    }
    const hosts = /^(\S+)\s+(\S+)(?:\s+#.*)?$/.exec(row)
    if (hosts && /^\d{1,3}(\.\d{1,3}){3}$|^::1$|^0:0:0:0:0:0:0:1$/.test(hosts[1])) {
      rules.push({ raw: row, kind: "hosts", host: hosts[2].toLowerCase(), subdomains: true, modifiers: "", address: hosts[1] })
      continue
    }
    if (/^[a-z0-9_*-]+(\.[a-z0-9_*@-]+)+$/i.test(row)) {
      rules.push({ raw: row, kind: "domain", host: row.toLowerCase(), subdomains: true, modifiers: "" })
      continue
    }
    rules.push({ raw: row, kind: "other", host: row.toLowerCase(), subdomains: false, modifiers: "" })
  }
  return { rules, skipped }
}

function piholeMatches(rule: PiholeRule, host: string): boolean {
  if (rule.invalid) return false
  if (rule.kind === "regex") return rule.pattern ? rule.pattern.test(host) : false
  if (!rule.host) return false
  if (rule.host === host) return true
  if (rule.subdomains) {
    if (rule.host.includes("*")) {
      const escaped = rule.host.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^.]*")
      return new RegExp(`(^|\\.)${escaped}$`).test(host)
    }
    return host.endsWith(`.${rule.host}`)
  }
  return false
}

export async function ruleMatchTest(args: { rules: string; domains: string }): Promise<string> {
  const { rules } = piholeParseRules(args.rules ?? "")
  const hosts = String(args.domains ?? "")
    .split(/[\s,;]+/)
    .map((d) => d.trim().toLowerCase().replace(/\.$/, ""))
    .filter(Boolean)
    .slice(0, 100)
  if (rules.length === 0) return "Paste the blocklist rules to test, one per line."
  if (hosts.length === 0) return "Paste the domains to test, separated by spaces, commas or newlines."
  const lines: string[] = [`${rules.length} rule(s) tested against ${hosts.length} domain(s).`, ""]
  const used = new Set<string>()
  let blocked = 0
  let allowed = 0
  for (const host of hosts) {
    const hits = rules.filter((r) => piholeMatches(r, host))
    for (const h of hits) used.add(h.raw)
    const exceptions = hits.filter((r) => r.kind === "exception")
    const blockers = hits.filter((r) => r.kind !== "exception")
    if (exceptions.length > 0 && blockers.length === 0) {
      allowed++
      lines.push(`${host}: ALLOWED by ${exceptions.slice(0, 2).map((r) => r.raw).join(" | ")}`)
    } else if (blockers.length > 0) {
      blocked++
      const notes: string[] = []
      if (exceptions.length > 0) notes.push(`but an exception also matches: ${exceptions.map((r) => r.raw).join(" | ")}`)
      const regexHit = blockers.some((r) => r.kind === "regex")
      if (regexHit) notes.push("matched by a regex rule, which Pi-hole applies before the DNS lookup")
      const withModifier = blockers.filter((r) => r.modifiers.length > 0)
      if (withModifier.length > 0) {
        notes.push(`has options this test ignores: ${withModifier.map((r) => r.modifiers).join(", ")}`)
      }
      lines.push(`${host}: BLOCKED by ${blockers.slice(0, 2).map((r) => r.raw).join(" | ")}${notes.length ? ` (${notes.join("; ")})` : ""}`)
    } else {
      lines.push(`${host}: not matched by any rule`)
    }
  }
  const unused = rules.filter((r) => !used.has(r.raw))
  lines.push("", `Blocked ${blocked}, allowed by an exception ${allowed}, unmatched ${hosts.length - blocked - allowed}.`)
  if (unused.length > 0) {
    lines.push(`${unused.length} rule(s) matched none of these domains: ${unused.slice(0, 8).map((r) => r.raw).join(", ")}${unused.length > 8 ? ", ..." : ""}`)
  }
  return lines.join("\n")
}

export async function blocklistAudit(args: { rules: string; name?: string }): Promise<string> {
  const { rules, skipped } = piholeParseRules(args.rules ?? "")
  if (rules.length === 0) return "Paste the blocklist to audit, one rule per line, in adblock, hosts or plain-domain form."
  const kinds = new Map<string, number>()
  const tlds = new Map<string, number>()
  const problems: string[] = []
  const seen = new Set<string>()
  const duplicates: string[] = []
  const hostSet = new Set<string>()
  const badRegex: string[] = []
  for (const r of rules) {
    kinds.set(r.kind, (kinds.get(r.kind) ?? 0) + 1)
    const key = r.raw.toLowerCase()
    if (seen.has(key)) duplicates.push(r.raw)
    else seen.add(key)
    if (r.invalid) badRegex.push(`${r.raw} -> ${r.invalid}`)
    if (r.host) {
      hostSet.add(r.host)
      const tld = r.host.split(".").pop() ?? "?"
      tlds.set(tld, (tlds.get(tld) ?? 0) + 1)
      if (/^xn--/.test(r.host)) problems.push(`${r.raw}: punycode IDN, make sure you actually want that domain blocked`)
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(r.host)) problems.push(`${r.raw}: an IP address belongs in an IP-range list, not a domain list`)
      if (r.host === "*" || r.host === ".*") problems.push(`${r.raw}: matches every domain and will break DNS`)
      if (r.host.startsWith(".")) problems.push(`${r.raw}: leading dot, write it as a subdomain rule instead`)
    }
    if (r.kind === "hosts" && r.address !== "127.0.0.1" && r.address !== "::1" && r.address !== "0.0.0.0" && r.address !== "0:0:0:0:0:0:0:1") {
      problems.push(`${r.raw}: hosts-file entries in a Pi-hole list should point at 0.0.0.0, not ${r.address}`)
    }
  }
  // a rule that covers only a subdomain of another rule in the same list is dead weight
  const redundant: string[] = []
  for (const r of rules) {
    if (!r.host || r.kind === "exception") continue
    for (const o of rules) {
      if (o === r || !o.host || o.kind === "exception" || o.kind === "only") continue
      if (o.host !== r.host && r.host.endsWith(`.${o.host}`)) {
        redundant.push(`${r.raw} (already covered by ${o.raw})`)
        break
      }
    }
  }
  const top = (m: Map<string, number>, n: number) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, c]) => `${k} (${c})`)
  const lines = [
    `${rules.length} rule(s) audited${args.name ? ` in ${args.name}` : ""}, ${skipped} comment or blank line(s) skipped.`,
    `Unique rules: ${seen.size}. Distinct domains: ${hostSet.size}.`,
    "",
    "By syntax: " + [...kinds.entries()].sort((a, b) => b[1] - a[1]).map(([k, c]) => `${k} ${c}`).join(", "),
    "Top TLDs: " + (top(tlds, 8).join(", ") || "none"),
  ]
  if (duplicates.length > 0) lines.push(`Duplicate rules: ${duplicates.length}, e.g. ${duplicates.slice(0, 5).join(" | ")}`)
  if (badRegex.length > 0) lines.push(`Invalid regular expressions (these are dropped by Pi-hole): ${badRegex.length}`, ...badRegex.slice(0, 5).map((b) => `  - ${b}`))
  const uniqueProblems = [...new Set(problems)]
  if (uniqueProblems.length > 0) {
    lines.push("", `Entry problems: ${uniqueProblems.length}.`)
    lines.push(...uniqueProblems.slice(0, 15).map((p) => `  - ${p}`))
  } else {
    lines.push("", "No punycode, stray IP, catch-all or bad-hosts-address entries.")
  }
  lines.push("", `Rules made redundant by a broader rule: ${redundant.length}.`)
  if (redundant.length > 0) lines.push(...redundant.slice(0, 10).map((r) => `  - ${r}`), redundant.length > 10 ? `  ...and ${redundant.length - 10} more.` : "")
  return lines.join("\n")
}

export interface PiholeForumArgs {
  query: string
  limit?: number
}

export async function communitySearch(args: PiholeForumArgs): Promise<string> {
  const query = (args.query ?? "").trim()
  if (!query) return "Give something to search the Pi-hole community forum for, e.g. 'DNSSEC not working'."
  const limit = Math.min(Math.max(Number(args.limit ?? 5), 1), 10)
  const res = await fetch(`${PHOLE_FORUM}/search.json?q=${encodeURIComponent(query)}`, {
    headers: { "User-Agent": "pihole-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new PiholeError(`Pi-hole forum search failed (${res.status}).`)
  const data = (await res.json()) as {
    topics?: Array<{ id?: number; title?: string; posts_count?: number; created_at?: string; slug?: string; tags?: string[] }>
    posts?: Array<{ blurb?: string; topic_id?: number; created_at?: string; username?: string }>
  }
  const topics = Array.isArray(data.topics) ? data.topics : []
  if (topics.length === 0) return `No Pi-hole community threads match "${query}".`
  const blurbFor = (id: unknown) => {
    const post = (data.posts ?? []).find((p) => p.topic_id === id)
    return (post?.blurb ?? "").replace(/\s+/g, " ").trim().slice(0, 200)
  }
  return [
    `${topics.length} thread(s) on the Pi-hole community forum match "${query}", showing ${Math.min(limit, topics.length)}.`,
    "",
    ...topics.slice(0, limit).map((t, i) => {
      const url = `https://discourse.pi-hole.net/t/${t.slug ?? "topic"}/${t.id ?? 0}`
      const parts = [`${i + 1}. [${t.id ?? "?"}] ${t.title ?? "(untitled)"}`]
      if (t.posts_count) parts.push(`${t.posts_count} posts`)
      if (t.created_at) parts.push(`started ${String(t.created_at).slice(0, 10)}`)
      if (t.tags && t.tags.length) parts.push(`tags: ${t.tags.slice(0, 4).join(", ")}`)
      const blurb = blurbFor(t.id)
      return [`${parts.join(", ")}`, `   ${url}`, blurb ? `   "${blurb}"` : ""].filter(Boolean).join("\n")
    }),
  ].join("\n")
}
