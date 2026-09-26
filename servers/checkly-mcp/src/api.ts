const UA = "mrfentmen-checkly-mcp/1.0"

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

const METHODS = ["GET", "HEAD", "POST", "PUT", "DELETE", "OPTIONS"]

const methodOf = (value: string | undefined): string => {
  const method = (value ?? "GET").trim().toUpperCase()
  if (!METHODS.includes(method)) throw new Error(`Method must be one of ${METHODS.join(", ")}.`)
  return method
}

interface Hop { url: string; status: number; location: string | null; ms: number }

interface FetchOutcome {
  status: number
  statusText: string
  finalUrl: string
  ms: number
  headers: Headers
  html: string
  hops: Hop[]
  bytes: number
}

async function fetchChain(target: string, timeoutMs = 20000, method = "GET"): Promise<FetchOutcome> {
  const start = Date.now()
  let url = normalizeTarget(target)
  const hops: Hop[] = []
  let res: Response | null = null

  // Redirects are followed by hand so every hop is visible; HEAD and OPTIONS keep
  // their method, other methods fall back to GET after the first hop so a redirect
  // does not turn into an unexpected write against the target.
  for (let i = 0; i < 6; i += 1) {
    const hopStart = Date.now()
    const useMethod = i === 0 ? method : "GET"
    res = await fetch(url, {
      method: useMethod,
      redirect: "manual",
      headers: { "User-Agent": UA, Accept: "*/*" },
      signal: AbortSignal.timeout(timeoutMs),
    })
    const location = res.headers.get("location")
    hops.push({ url: url.toString(), status: res.status, location, ms: Date.now() - hopStart })
    if (res.status >= 300 && res.status < 400 && location) {
      url = new URL(location, url)
      continue
    }
    break
  }

  if (!res) throw new Error("No response received.")
  const body = method === "HEAD" ? "" : await res.text()
  return {
    status: res.status,
    statusText: res.statusText,
    finalUrl: url.toString(),
    ms: Date.now() - start,
    headers: res.headers,
    html: body.slice(0, 200000),
    hops,
    bytes: Buffer.byteLength(body),
  }
}

export async function checkUrl(args: { url: string }): Promise<string> {
  const r = await fetchChain(args.url, 15000)
  const ok = r.status >= 200 && r.status < 400
  return [
    `${ok ? "UP" : "DOWN"} — ${r.finalUrl}`,
    `HTTP ${r.status} ${r.statusText} in ${r.ms} ms`,
    `Server: ${r.headers.get("server") ?? "not disclosed"} | Content type: ${r.headers.get("content-type") ?? "unknown"}`,
    r.hops.length > 1 ? `Redirects: ${r.hops.length - 1}` : "Redirects: none",
    r.bytes ? `Body read: ${r.bytes} byte(s)` : "",
  ].filter(Boolean).join("\n")
}

/** Parses "200", "2xx", "200-204" or "200,204,301" into a matcher. */
function statusMatcher(expected: string): (status: number) => boolean {
  const parts = expected.split(",").map((p) => p.trim()).filter(Boolean)
  if (!parts.length) throw new Error('Provide the status to expect, for example "200" or "2xx".')
  const tests: Array<(status: number) => boolean> = []
  for (const part of parts) {
    const family = part.match(/^(\d)xx$/i)
    const range = part.match(/^(\d{3})\s*-\s*(\d{3})$/)
    if (family) {
      const hundreds = Number(family[1])
      tests.push((status) => Math.floor(status / 100) === hundreds)
    } else if (range) {
      const low = Number(range[1])
      const high = Number(range[2])
      tests.push((status) => status >= low && status <= high)
    } else if (/^\d{3}$/.test(part)) {
      const exact = Number(part)
      tests.push((status) => status === exact)
    } else {
      throw new Error(`"${part}" is not a status match. Use 200, 2xx, 200-204 or a comma-separated list.`)
    }
  }
  return (status) => tests.some((t) => t(status))
}

export interface Assertion { name: string; passed: boolean; detail: string }

const summarise = (title: string, checks: Assertion[]): string => {
  const passed = checks.filter((c) => c.passed).length
  const verdict = passed === checks.length ? "PASSED" : "FAILED"
  const width = Math.max(...checks.map((c) => c.name.length))
  return [
    title,
    `${verdict} — ${passed} of ${checks.length} assertion(s) held`,
    "",
    ...checks.map((c) => `${c.passed ? "PASS" : "FAIL"} ${c.name.padEnd(width)}  ${c.detail}`),
  ].join("\n")
}

export async function assertStatus(args: { url: string; expected: string; method?: string }): Promise<string> {
  const method = methodOf(args.method)
  const matcher = statusMatcher(args.expected)
  const r = await fetchChain(args.url, 20000, method)
  const checks: Assertion[] = [
    {
      name: "status",
      passed: matcher(r.status),
      detail: `HTTP ${r.status} (expected ${args.expected}) after ${r.ms} ms via ${method}`,
    },
    {
      name: "no loop",
      passed: r.hops.length < 6,
      detail: r.hops.length >= 6 ? "redirect chain hit the 6-hop limit, so it may never terminate" : `${r.hops.length} hop(s) to ${r.finalUrl}`,
    },
    {
      name: "speed",
      passed: r.ms <= 3000,
      detail: `${r.ms} ms to the final response (budget 3000 ms)`,
    },
  ]
  return summarise(`Synthetic check for ${normalizeTarget(args.url).toString()}`, checks)
}

export async function assertHeaders(args: {
  url: string
  required?: string[]
  forbidden?: string[]
  header?: string
  contains?: string
}): Promise<string> {
  const r = await fetchChain(args.url, 20000)
  const checks: Assertion[] = []

  for (const name of (args.required ?? []).map((n) => n.trim().toLowerCase()).filter(Boolean).slice(0, 15)) {
    const value = r.headers.get(name)
    checks.push({ name: `has ${name}`, passed: Boolean(value), detail: value ? value.slice(0, 160) : "header not sent" })
  }

  for (const name of (args.forbidden ?? []).map((n) => n.trim().toLowerCase()).filter(Boolean).slice(0, 15)) {
    const value = r.headers.get(name)
    checks.push({ name: `no ${name}`, passed: !value, detail: value ? `leaked: ${value.slice(0, 160)}` : "not sent, as required" })
  }

  if (args.header) {
    const name = args.header.trim().toLowerCase()
    const value = r.headers.get(name)
    const wanted = args.contains ?? ""
    checks.push({
      name: `${name} contains`,
      passed: Boolean(value) && (!wanted || value!.includes(wanted)),
      detail: value ? `${value.slice(0, 160)}${wanted ? ` (looking for "${wanted}")` : ""}` : "header not sent",
    })
  }

  if (!checks.length) return "Provide at least one of required (header names that must be present), forbidden (header names that must not be) or header plus contains."
  return summarise(`Header assertions for ${r.finalUrl} (HTTP ${r.status})`, checks)
}

export async function assertContent(args: {
  url: string
  contains?: string[]
  notContains?: string[]
}): Promise<string> {
  const r = await fetchChain(args.url, 20000)
  const haystack = r.html.toLowerCase()
  const checks: Assertion[] = []

  for (const needle of (args.contains ?? []).map((s) => String(s)).filter(Boolean).slice(0, 15)) {
    checks.push({
      name: `contains "${needle.slice(0, 40)}"`,
      passed: haystack.includes(needle.toLowerCase()),
      detail: haystack.includes(needle.toLowerCase()) ? "found in the HTML" : "not present in the HTML",
    })
  }

  for (const needle of (args.notContains ?? []).map((s) => String(s)).filter(Boolean).slice(0, 15)) {
    checks.push({
      name: `no "${needle.slice(0, 40)}"`,
      passed: !haystack.includes(needle.toLowerCase()),
      detail: haystack.includes(needle.toLowerCase()) ? "found in the HTML, and it should not be there" : "absent, as required",
    })
  }

  if (!checks.length) return "Provide at least one string in contains (must appear) or notContains (must not appear)."
  return summarise(`Content assertions for ${r.finalUrl} (HTTP ${r.status})`, checks)
}

export async function checkRedirects(args: { url: string }): Promise<string> {
  const r = await fetchChain(args.url, 15000)
  const lines = [`Redirect chain for ${normalizeTarget(args.url).toString()} — ${r.hops.length} hop(s)`, ""]
  r.hops.forEach((hop, i) => {
    lines.push(`${i + 1}. ${hop.status} ${hop.url} (${hop.ms} ms)`)
    if (hop.location) lines.push(`     -> ${hop.location}`)
  })

  const seen = new Set<string>()
  let loop = false
  for (const hop of r.hops) {
    if (seen.has(hop.url)) loop = true
    seen.add(hop.url)
  }
  const insecureFirst = r.hops[0]?.url.startsWith("http://") ?? false
  const endsSecure = r.finalUrl.startsWith("https://")
  const extra = r.hops.length - 1

  lines.push("", `Final URL: ${r.finalUrl}`)
  lines.push(`Redirect loop: ${loop ? "YES — the chain revisits a URL" : "no"}`)
  lines.push(`Extra hops to remove: ${Math.max(extra - 1, 0)}`)
  if (insecureFirst) lines.push(`Starts on plain HTTP: yes ${endsSecure ? "and upgrades to HTTPS" : "and never upgrades to HTTPS"}`)
  if (r.hops.length >= 6) lines.push("Warning: the chain hit the 6-hop limit, so it may never terminate.")
  return lines.join("\n")
}

export async function brokenLinks(args: { url: string; limit?: number }): Promise<string> {
  const base = normalizeTarget(args.url)
  const limit = Math.min(Math.max(Number(args.limit ?? 15) || 15, 1), 40)
  const page = await fetchChain(base.toString(), 20000)

  const hrefs = [...page.html.matchAll(/<a[^>]+href=["']([^"'#]+)["']/gi)]
    .map((m) => m[1])
    .filter((href) => !/^(mailto:|tel:|javascript:|data:)/i.test(href))

  const unique: string[] = []
  const seen = new Set<string>()
  for (const href of hrefs) {
    let absolute: string
    try {
      absolute = new URL(href, base).toString()
    } catch {
      continue
    }
    if (seen.has(absolute)) continue
    seen.add(absolute)
    unique.push(absolute)
    if (unique.length >= limit) break
  }

  if (!unique.length) return `No links found on ${page.finalUrl}.`

  const rows: string[] = []
  let broken = 0
  // Sequential: a link check should not open many sockets to one host at once.
  for (const link of unique) {
    try {
      const res = await fetch(link, {
        method: "HEAD",
        redirect: "follow",
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(12000),
      })
      const bad = res.status >= 400
      if (bad) broken += 1
      rows.push(`${bad ? "BROKEN" : "ok    "} ${res.status} ${link}`)
    } catch (e) {
      broken += 1
      rows.push(`BROKEN --- ${link} (${errorMessage(e)})`)
    }
  }

  return [
    `Link check for ${page.finalUrl}`,
    `Checked ${unique.length} link(s) found on the page: ${broken} broken.`,
    "",
    ...rows,
  ].join("\n")
}
