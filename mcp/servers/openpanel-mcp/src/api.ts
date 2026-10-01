export class OpenpanelError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "OpenpanelError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new OpenpanelError(`Set the ${name} environment variable.`)
  return v
}

async function authHeaders(): Promise<Record<string, string>> {
  const id = envStrict("OPENPANEL_CLIENT_ID");
  const sec = envStrict("OPENPANEL_CLIENT_SECRET");
  return { Authorization: "Basic " + Buffer.from(`${id}:${sec}`).toString("base64") };
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(url: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { ...UA, ...(await authHeaders()), ...(init.headers ?? {}) }, ...init })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new OpenpanelError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function getMetrics(projectId: string, startDate?: string, endDate?: string): Promise<string> {
  let url = `https://api.openpanel.dev/insights/${encodeURIComponent(String(projectId))}/metrics`;
  const qs = new URLSearchParams();
  if (startDate !== undefined) qs.append("startDate", String(startDate));
  if (endDate !== undefined) qs.append("endDate", String(endDate));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getLive(projectId: string): Promise<string> {
  let url = `https://api.openpanel.dev/insights/${encodeURIComponent(String(projectId))}/live`;
  const data = await req(url);
  return pretty(data);
}

export async function getPages(projectId: string): Promise<string> {
  let url = `https://api.openpanel.dev/insights/${encodeURIComponent(String(projectId))}/pages`;
  const data = await req(url);
  return pretty(data);
}

export async function getReferrer(projectId: string): Promise<string> {
  let url = `https://api.openpanel.dev/insights/${encodeURIComponent(String(projectId))}/referrer`;
  const data = await req(url);
  return pretty(data);
}

// ---- muxG tools:

const OP_LIST_CAP = 10

function opBound(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(Math.floor(n), max))
}

const OP_SEARCH_ENGINES = [
  { name: "Google", re: /(^|\.)google\.[a-z.]+$/i },
  { name: "Bing", re: /(^|\.)bing\.com$/i },
  { name: "DuckDuckGo", re: /duckduckgo\.com$/i },
  { name: "Yahoo", re: /(^|\.)search\.yahoo\./i },
  { name: "Yandex", re: /yandex\.[a-z.]+$/i },
  { name: "Baidu", re: /baidu\.com$/i },
  { name: "Ecosia", re: /ecosia\.org$/i },
  { name: "Brave", re: /search\.brave\.com$/i },
  { name: "Startpage", re: /startpage\.com$/i },
  { name: "Qwant", re: /qwant\.com$/i },
]
const OP_SOCIAL = [
  { name: "Facebook", re: /(^|\.)facebook\.com$|(^|\.)l\.facebook\.com$/i },
  { name: "Instagram", re: /(^|\.)instagram\.com$/i },
  { name: "X / Twitter", re: /(^|\.)(twitter|x)\.com$/i },
  { name: "LinkedIn", re: /(^|\.)linkedin\.com$/i },
  { name: "Reddit", re: /(^|\.)reddit\.com$/i },
  { name: "YouTube", re: /(^|\.)youtube\.com$|(^|\.)youtu\.be$/i },
  { name: "TikTok", re: /(^|\.)tiktok\.com$/i },
  { name: "Pinterest", re: /(^|\.)pinterest\.[a-z.]+$/i },
  { name: "Mastodon", re: /mastodon\.[a-z.]+$/i },
  { name: "Bluesky", re: /bsky\.app$/i },
  { name: "Threads", re: /(^|\.)threads\.net$/i },
]
const OP_EMAIL = /(^|\.)(mail\.|email\.|outlook\.|gmail\.|yahoo\.|proton(mail)?\.|fastmail\.|zoho\.)/i
const OP_NEWSLETTER = /(^|\.)(newsletter\.|substack\.com|buttondown\.|mailchimp\.|convertkit\.|beehiiv\.|ghost\.|sendgrid\.)/i
const OP_PAID = /(^|\.)(googleadservices\.|doubleclick\.net|ads?\.|adnxs\.|criteo\.|taboola\.|outbrain\.|linkedin\.com\/ads|bing\.com\/aclp)/i

/** Classify a list of referrers the way a traffic report has to before it can be read. */
export async function referrerTaxonomy(args: { referrers?: string; limit?: number }): Promise<string> {
  const raw = String(args?.referrers ?? "").trim()
  if (!raw) throw new OpenpanelError("referrers is empty. Paste one referrer per line, as your analytics export gives them.")
  const limit = opBound(args.limit, 1, OP_LIST_CAP, 10)
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (!lines.length) throw new OpenpanelError("referrers contains only blank lines.")

  const buckets = new Map<string, number>()
  const detail = new Map<string, string[]>()
  let ownSite = 0
  let bare = 0
  let unparseable = 0

  for (const line of lines) {
    let host = line
    try {
      const withScheme = /^https?:\/\//i.test(line) ? line : `https://${line}`
      host = new URL(withScheme).hostname.toLowerCase()
    } catch {
      unparseable += 1
    }
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host)) {
      if (!host) bare += 1
    }

    let bucket: string
    if (OP_NEWSLETTER.test(host)) bucket = "email newsletter"
    else if (OP_EMAIL.test(host)) bucket = "email client"
    else if (OP_PAID.test(host)) bucket = "paid advertising"
    else if (OP_SEARCH_ENGINES.some((s) => s.re.test(host))) bucket = "organic search"
    else if (OP_SOCIAL.some((s) => s.re.test(host))) bucket = "social"
    else if (!host || host === "direct") bucket = "direct / none"
    else bucket = "referral, unrecognised"

    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1)
    if (!detail.has(bucket)) detail.set(bucket, [])
    const list = detail.get(bucket)!
    if (list.length < 3) list.push(host || "(no host)")
  }

  const total = lines.length
  const ranked = [...buckets.entries()].sort((a, b) => b[1] - a[1])
  const own = ranked.find(([k]) => k === "referral, unrecognised")

  return [
    "Referrer taxonomy, computed locally on the list you supplied",
    `${total} referrer(s) classified into ${ranked.length} bucket(s)${unparseable ? `, ${unparseable} could not be parsed as a URL` : ""}${bare ? `, ${bare} were bare hostnames` : ""}`,
    "",
    ...ranked.map(([bucket, n]) => {
      const hosts = detail.get(bucket) ?? []
      return `  ${String(n).padStart(5)}  ${((n / total) * 100).toFixed(1).padStart(5)}%  ${bucket}${hosts.length ? `   e.g. ${hosts.join(", ")}` : ""}`
    }),
    "",
    own
      ? `${own[1]} referrer(s) did not match any known search, social, email or paid host. That bucket is where a self-referral, a link shortener, an in-app browser or a crawler ends up, so read it before treating it as real traffic.`
      : "Every referrer matched a known category, which is unusual and worth double checking your export.",
    "A referrer host is not a source of truth: in-app browsers report the app, link shorteners report the shortener, and most privacy settings send nothing at all, so direct traffic here understates what most analytics tools report.",
  ].join("\n")
}
