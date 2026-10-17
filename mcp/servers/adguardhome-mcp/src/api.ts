successfully downloaded text file (SHA: ee4def7b2deaa2da409ef97491df1d5f72a49363)
export class AdGuardError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AdGuardError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
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
  if (!new RegExp("^https://[a-z0-9.-]+/", "i").test(target)) {
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

// ---- gap4a1 tools:



// ---- domain_coverage: check if a domain is covered by an AdGuard filter list ----
export async function domainCoverage(args: { domain: string; url?: string }): Promise<string> {
  const domain = (args.domain ?? '').trim().toLowerCase();
  if (!domain) return 'Provide a domain to check.';
  const l = await agFetchList(String(args?.url ?? AG_REGISTRY));

  const parts = domain.split('.');
  let covered = false;
  let coveringRule = null;

  for (let i = 0; i < parts.length - 1; i++) {
    const candidate = parts.slice(i).join('.');
    if (l.listDomains.has(candidate)) {
      covered = true;
      coveringRule = candidate;
      break;
    }
  }

  const lines = [
    'Domain coverage check for "' + domain + '" against ' + l.url,
    '',
    covered
      ? 'COVERED: "' + domain + '" is covered by a rule for "' + coveringRule + '" (parent domains are also covered).'
      : 'NOT COVERED: "' + domain + '" does not match any rule in this list.',
    '',
    'The check tests the domain exactly, then every parent up to the registrable domain,',
    'because a rule for a parent also covers all subdomains.',
  ];

  if (l.exceptions > 0) {
    lines.push('');
    lines.push('Note: this list contains ' + l.exceptions + ' exception rule(s) (@@) that may re-admit blocked domains.');
  }

  return lines.join('\n');
}

// ---- filter_catalog: discover published AdGuard DNS filter lists ----
export async function filterCatalog(args: { query?: string; limit?: number }): Promise<string> {
  const query = (args.query ?? '').trim().toLowerCase();
  const limit = agBound(args.limit, 1, 30, 10);

  const registryUrl = 'https://adguardteam.github.io/HostlistsRegistry/assets/filters.json';
  const res = await fetch(registryUrl, { headers: { 'User-Agent': 'awesome-mcps/1.0', Accept: 'application/json' }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new AdGuardError('Registry returned HTTP ' + res.status);
  const data = (await res.json()) as Array<Record<string, unknown>>;

  if (!Array.isArray(data)) throw new AdGuardError('Unexpected registry format.');

  let filtered = data;
  if (query) {
    filtered = data.filter((f) => {
      const name = String(f.name ?? '').toLowerCase();
      const desc = String(f.description ?? '').toLowerCase();
      return name.includes(query) || desc.includes(query);
    });
  }

  filtered = filtered.slice(0, limit);

  if (!filtered.length) return 'No filter lists found' + (query ? ' matching "' + query + '"' : '') + '.';

  const lines = ['AdGuard DNS filter catalog' + (query ? ' (query: "' + query + '")' : '') + ', ' + filtered.length + ' list(s):', ''];
  for (const f of filtered) {
    lines.push('• ' + String(f.name ?? 'unnamed'));
    lines.push('  ' + String(f.description ?? 'no description').slice(0, 120));
    lines.push('  URL: ' + String(f.downloadUrl ?? f.homepage ?? 'n/a'));
    if (f.version) lines.push('  Version: ' + f.version + ' | Updated: ' + (f.timeAdded ? new Date(Number(f.timeAdded)).toISOString().slice(0, 10) : 'n/a'));
    lines.push('');
  }
  return lines.join('\n');
}
