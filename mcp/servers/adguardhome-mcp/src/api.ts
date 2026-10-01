export class AdGuardError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AdGuardError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function base(): string {
  const b = process.env.ADGUARD_URL;
  if (!b) throw new AdGuardError("Set ADGUARD_URL (your AdGuard Home URL).");
  return b.replace(/\/$/, "");
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { ...UA, Accept: "application/json" };
  const u = process.env.ADGUARD_USER;
  const p = process.env.ADGUARD_PASS;
  if (u && p) h.Authorization = `Basic ${Buffer.from(`${u}:${p}`).toString("base64")}`;
  return h;
}

async function get(path: string, maxChars: number): Promise<string> {
  let res: Response;
  try {
    res = await fetch(base() + path, { signal: AbortSignal.timeout(30000), headers: headers() });
  } catch (e) {
    throw new AdGuardError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new AdGuardError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, maxChars);
}

export function getStatus(): Promise<string> {
  return get("/control/status", 2000);
}

export function getStats(): Promise<string> {
  return get("/control/stats", 4000);
}

export function getQueryLog(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 100);
  return get(`/control/querylog?limit=${n}`, 12000);
}

// ---- muxI tools:
const AG_REGISTRY = "https://adguardteam.github.io/HostlistsRegistry/assets/filter_1.txt"
const AG_LIST_CAP = 12
const AG_MAX_BYTES = 12_000_000

interface AgList {
  url: string
  title: string
  version: string
  lastModified: string
  description: string
  total: number
  comments: number
  exceptions: number
  domainRules: number
  hostsRules: number
  regexRules: number
  cosmeticRules: number
  plainRules: number
  modifierCounts: Map<string, number>
  domains: string[]
  hosts: string[]
  regexes: string[]
  cosmetics: string[]
  plain: string[]
  listDomains: Set<string>
  topDomains: [string, number][]
  fetchedAt: string
}

function agBound(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(Math.floor(n), max))
}

async function agFetchList(url: string): Promise<AgList> {
  let target = String(url ?? "").trim()
  if (!target) target = AG_REGISTRY
  if (!/^https:\/\/[a-z0-9.-]+\//i.test(target)) {
    throw new AdGuardError(`"${target}" is not an https URL, so it will not be fetched. Pass a full https URL to a plain-text filter list.`)
  }
  const res = await fetch(target, { headers: { "User-Agent": "awesome-mcps/1.0", Accept: "text/plain" }, signal: AbortSignal.timeout(60000) })
  if (res.status === 404) throw new AdGuardError(`Nothing at ${target} (HTTP 404).`)
  if (!res.ok) throw new AdGuardError(`The list at ${target} returned HTTP ${res.status}.`)
  const body = (await res.text()).slice(0, AG_MAX_BYTES)

  const out: AgList = {
    url: target,
    title: "not reported",
    version: "not reported",
    lastModified: "not reported",
    description: "not reported",
    total: 0,
    comments: 0,
    exceptions: 0,
    domainRules: 0,
    hostsRules: 0,
    regexRules: 0,
    cosmeticRules: 0,
    plainRules: 0,
    modifierCounts: new Map<string, number>(),
    domains: [],
    hosts: [],
    regexes: [],
    cosmetics: [],
    plain: [],
    listDomains: new Set<string>(),
    topDomains: [],
    fetchedAt: new Date().toISOString().replace(".000Z", "Z"),
  }

  const domainCounts = new Map<string, number>()
  for (const raw of body.split("\n")) {
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith("!")) {
      out.comments += 1
      const t = /^!\s*Title:\s*(.+)$/i.exec(line)
      const v = /^!\s*Version:\s*(.+)$/i.exec(line)
      const lm = /^!\s*Last modified:\s*(.+)$/i.exec(line)
      const d = /^!\s*Description:\s*(.+)$/i.exec(line)
      if (t) out.title = t[1].trim()
      if (v) out.version = v[1].trim()
      if (lm) out.lastModified = lm[1].trim()
      if (d && out.description === "not reported") out.description = d[1].trim().slice(0, 300)
      continue
    }
    out.total += 1
    if (line.startsWith("@@")) {
      out.exceptions += 1
      const dom = /@@\|\|([^^$*|/]+)/.exec(line)?.[1]
      if (dom) out.domains.push(dom.toLowerCase())
      continue
    }
    if (line.includes("##")) {
      out.cosmeticRules += 1
      if (out.cosmetics.length < AG_LIST_CAP) out.cosmetics.push(line.slice(0, 90))
      continue
    }
    if (/^\/.*\/$/.test(line)) {
      out.regexRules += 1
      if (out.regexes.length < AG_LIST_CAP) out.regexes.push(line.slice(0, 90))
      continue
    }
    if (/^\d{1,3}(\.\d{1,3}){3}\s+\S+/.test(line) || /^::\s+\S+/.test(line)) {
      out.hostsRules += 1
      const dom = line.split(/\s+/)[1]?.toLowerCase()
      if (dom) {
        out.hosts.push(dom)
        domainCounts.set(dom, (domainCounts.get(dom) ?? 0) + 1)
        out.listDomains.add(dom)
      }
      continue
    }
    const isDomain = line.startsWith("||")
    if (isDomain) out.domainRules += 1
    else out.plainRules += 1
    const dom = (isDomain ? line.slice(2) : line).split("^")[0]?.split("$")[0]?.split("/")[0]?.trim().toLowerCase()
    if (dom && /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/.test(dom)) {
      out.listDomains.add(dom)
      if (out.domains.length < 4000) out.domains.push(dom)
      domainCounts.set(dom, (domainCounts.get(dom) ?? 0) + 1)
    }
    if (out.plain.length < AG_LIST_CAP) out.plain.push(line.slice(0, 90))
    const mods = line.split("$")[1]
    if (mods) {
      for (const m of mods.split(",")) {
        const key = m.trim().toLowerCase()
        if (key) out.modifierCounts.set(key, (out.modifierCounts.get(key) ?? 0) + 1)
      }
    }
  }
  out.topDomains = [...domainCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, AG_LIST_CAP)
  if (!out.total) throw new AdGuardError(`The list at ${target} parsed to zero rules; it may be an HTML error page rather than a filter list.`)
  return out
}

function agDescribe(l: AgList): string[] {
  return [
    `Title: ${l.title}`,
    `Version: ${l.version} | last modified ${l.lastModified} | fetched ${l.fetchedAt}`,
    l.description !== "not reported" ? `Description: ${l.description}` : "Description: not reported",
    `Source: ${l.url}`,
  ]
}

/** What a public AdGuard filter list actually contains, read without any AdGuard Home instance. */
export async function filterRuleAudit(args: { url?: string }): Promise<string> {
  const l = await agFetchList(String(args?.url ?? AG_REGISTRY))
  const modifiers = [...l.modifierCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, AG_LIST_CAP)
  const hosts = l.hostsRules
  return [
    "AdGuard filter list audit, read directly from the published list",
    ...agDescribe(l),
    "",
    `Lines: ${l.total + l.comments} total, ${l.comments} comment or header, ${l.total} rule lines`,
    "",
    "Rule syntax breakdown:",
    `  ||domain^        domain rules:        ${l.domainRules}`,
    `  0.0.0.0 domain   hosts-file rules:    ${hosts}`,
    `  /regex/          regular expressions: ${l.regexRules}`,
    `  domain##selector cosmetic rules:     ${l.cosmeticRules}`,
    `  plain text       substring rules:     ${l.plainRules}`,
    `  @@||domain^     exception rules:     ${l.exceptions}`,
    `  distinct domains seen: ${l.listDomains.size.toLocaleString("en-US")}`,
    "",
    hosts > 0
      ? `Most frequent hosts entries: ${l.topDomains.slice(0, 6).map(([d, n]) => `${d} (x${n})`).join(", ")}`
      : "Most frequently targeted domains:",
    "",
    modifiers.length ? "Most used modifiers:" : "No modifiers found in the rule lines.",
    ...(modifiers.length ? modifiers.map(([k, n]) => `  ${String(n).padStart(7)}  ${k}`) : []),
    l.cosmetics.length ? `Cosmetic rules (a web filter feature, ignored by a DNS-only resolver): ${l.cosmeticRules}` : "",
    "",
    "A DNS-level resolver ignores cosmetic rules entirely, so a list carrying many of them is being consumed by something that cannot use them. Exception rules are the ones worth counting before adding a list: each @@ line re-admits a domain the same list blocks elsewhere.",
  ]
    .filter(Boolean)
    .join("\n")
}

/** Is one domain actually covered by a list, and by which rule syntax. */
export async function domainCoverage(args: { domain?: string; url?: string }): Promise<string> {
  const raw = String(args?.domain ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0] ?? ""
  const domain = raw.replace(/\.$/, "")
  if (!domain || !/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/.test(domain)) {
    throw new AdGuardError(`"${args.domain}" is not a domain, for example ads.example.com.`)
  }
  const l = await agFetchList(String(args?.url ?? AG_REGISTRY))

  const exact = l.listDomains.has(domain)
  const parents: string[] = []
  const parts = domain.split(".")
  for (let i = 1; i <= parts.length - 2; i += 1) parents.push(parts.slice(i).join("."))
  const parentHit = parents.find((p) => l.listDomains.has(p))
  const exceptions = l.domains.filter((d) => d === domain || domain.endsWith(`.${d}`)).slice(0, AG_LIST_CAP)

  return [
    `Is ${domain} covered by the list?`,
    ...agDescribe(l),
    "",
    exact
      ? `Yes, exactly. The domain appears in its own right in this list.`
      : parentHit
        ? `Not exactly, but ${parentHit} is listed, and an AdGuard domain rule for ${parentHit} also covers every subdomain including ${domain}.`
        : `No. Neither ${domain} nor any parent of it up to the registrable domain appears in the ${l.listDomains.size.toLocaleString("en-US")} domain(s) this list names.`,
    `Exception rules that would re-admit it: ${exceptions.length ? exceptions.join(", ") : "none found"}`,
    "",
    `Parents checked, shortest to longest: ${parents.join(", ")}`,
    "",
    "Absence from the list is not permission: a DNS filter only blocks what it names, so an unlisted domain is simply not covered rather than verified clean. A wildcard subdomain rule covers far more than the domains it spells out, which is why a plain text search of the file is not the same question this tool answers.",
  ]
    .join("\n")
}
