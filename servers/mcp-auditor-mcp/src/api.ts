const UA = "mrfentmen-mcp-auditor-mcp/1.0"
const PROTOCOL_VERSION = "2024-11-05"

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

export function normalizeTarget(input: string): URL {
  const raw = (input ?? "").trim()
  if (!raw) throw new Error("Provide a URL, for example https://api.example.com/items.")
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  let url: URL
  try {
    url = new URL(withScheme)
  } catch {
    throw new Error(`"${input}" is not a valid URL.`)
  }
  if (!url.hostname.includes(".")) throw new Error(`"${input}" does not look like a public hostname.`)
  return url
}

// ---------------------------------------------------------------------------
// MCP over streamable HTTP
// ---------------------------------------------------------------------------

interface RpcReply {
  status: number | null
  body: unknown
  session: string | null
  error: string | null
}

/**
 * Posts one JSON-RPC message. The streamable HTTP transport may answer with plain
 * JSON or with an SSE stream, so both shapes are unwrapped. No credentials are
 * ever attached: the auditor only talks to endpoints that are public.
 */
async function rpcPost(url: string, message: unknown, session: string | null, timeoutMs = 30000): Promise<RpcReply> {
  let res: Response
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "User-Agent": UA,
        ...(session ? { "mcp-session-id": session } : {}),
      },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (e) {
    return { status: null, body: null, session: null, error: errorMessage(e) }
  }

  const raw = await res.text()
  const payload = raw.includes("data:")
    ? raw.split(/\r?\n/).filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trim()).join("\n")
    : raw
  let body: unknown = null
  try {
    body = JSON.parse(payload)
  } catch {
    body = { unparsed: payload.slice(0, 400) }
  }
  return { status: res.status, body, session: res.headers.get("mcp-session-id"), error: null }
}

interface McpTool {
  name: string
  title?: string
  description?: string
  inputSchema?: { type?: string; properties?: Record<string, { type?: string; description?: string }>; required?: string[] }
  annotations?: Record<string, unknown>
}

interface McpInventory {
  serverName: string
  serverVersion: string
  protocolVersion: string
  tools: McpTool[]
  attempts: number
}

const asResult = (reply: RpcReply): Record<string, unknown> | null => {
  const body = reply.body as { result?: Record<string, unknown> } | null
  return body?.result ?? null
}

/**
 * Handshakes with an MCP endpoint and reads its tool list. Held-open standby
 * containers answer slowly on their first request, so it retries a few times.
 */
async function mcpInventory(url: string, attempts = 3, timeoutMs = 30000): Promise<McpInventory> {
  let last = "no response"
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const init = await rpcPost(url, {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: PROTOCOL_VERSION, capabilities: {}, clientInfo: { name: "mcp-auditor", version: "1.0.0" } },
    }, null, timeoutMs)

    if (init.status !== 200) {
      last = init.error ?? `initialize answered HTTP ${init.status}`
      continue
    }
    const initResult = asResult(init)
    if (!initResult) {
      last = "initialize returned no result"
      continue
    }

    // The spec requires this notification after initialize; the reply is empty by design.
    await rpcPost(url, { jsonrpc: "2.0", method: "notifications/initialized" }, init.session, timeoutMs)

    const list = await rpcPost(url, { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }, init.session, timeoutMs)
    const listResult = asResult(list)
    if (!listResult) {
      last = list.error ?? `tools/list answered HTTP ${list.status}`
      continue
    }

    const info = (initResult.serverInfo ?? {}) as { name?: string; version?: string }
    const tools = (listResult.tools ?? []) as McpTool[]
    return {
      serverName: info.name ?? "unnamed",
      serverVersion: info.version ?? "unknown",
      protocolVersion: String(initResult.protocolVersion ?? "unknown"),
      tools,
      attempts: attempt,
    }
  }
  const auth = /HTTP 401|HTTP 403/.test(last)
  throw new Error(
    `Could not talk MCP to ${url}: ${last}. ` +
    (auth
      ? "It refused an anonymous handshake. That is correct for a private endpoint, and it is also how hosted platforms behave when OAuth is handled by their own gateway rather than by the endpoint. Either way this auditor never attaches credentials, so use audit_tools with a tools/list payload you already have."
      : "This auditor only speaks to endpoints that answer without credentials."),
  )
}

// ---------------------------------------------------------------------------
// probe_keyless
// ---------------------------------------------------------------------------

const RATE_HEADERS = ["x-ratelimit-limit", "x-ratelimit-remaining", "x-ratelimit-reset", "retry-after", "ratelimit-limit", "ratelimit-remaining"]

export async function probeKeyless(args: { url: string; method?: string }): Promise<string> {
  const url = normalizeTarget(args.url)
  const method = (args.method ?? "GET").trim().toUpperCase()
  if (!["GET", "HEAD", "POST"].includes(method)) throw new Error("Method must be GET, HEAD or POST.")

  const start = Date.now()
  let res: Response
  try {
    res = await fetch(url, {
      method,
      headers: { "User-Agent": UA, Accept: "application/json, */*" },
      signal: AbortSignal.timeout(25000),
    })
  } catch (e) {
    throw new Error(`Could not reach ${url.toString()}: ${errorMessage(e)}`)
  }
  const ms = Date.now() - start
  const raw = method === "HEAD" ? "" : (await res.text()).slice(0, 400000)
  const contentType = res.headers.get("content-type") ?? "not stated"

  let shape = "not read"
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed)) {
        const first = parsed[0]
        const keys = first && typeof first === "object" ? Object.keys(first as object).slice(0, 12) : []
        shape = `JSON array with ${parsed.length} item(s)${keys.length ? `, first item keys: ${keys.join(", ")}` : ""}`
      } else if (parsed && typeof parsed === "object") {
        shape = `JSON object with keys: ${Object.keys(parsed as object).slice(0, 12).join(", ")}`
      } else {
        shape = `JSON ${typeof parsed}`
      }
    } catch {
      const looksHtml = /^\s*</.test(raw)
      shape = looksHtml ? "HTML, not JSON" : `plain text, ${raw.length} character(s)`
    }
  }

  const needsAuth = res.status === 401 || res.status === 403
  const verdict = needsAuth
    ? "NEEDS CREDENTIALS — this endpoint rejected an anonymous request, so it cannot back a keyless server."
    : res.status === 404
      ? "NOT FOUND — check the path; a wrong path looks the same as a required key."
      : res.status >= 500
        ? "UPSTREAM ERROR — the service answered with a server error, so it is not reliable enough to depend on yet."
        : res.ok
          ? "KEYLESS OK — answered without any credentials."
          : `UNEXPECTED — HTTP ${res.status} with no credentials attached.`

  const lines = [
    `Keyless probe for ${url.toString()} (${method})`,
    `Verdict: ${verdict}`,
    "",
    `HTTP ${res.status} ${res.statusText} in ${ms} ms`,
    `Content type: ${contentType}`,
    `Shape: ${shape}`,
    `Server: ${res.headers.get("server") ?? "not stated"}`,
  ]

  const rate = RATE_HEADERS.map((h) => [h, res.headers.get(h)] as const).filter(([, v]) => v)
  lines.push(rate.length ? `Rate-limit headers: ${rate.map(([h, v]) => `${h}=${v}`).join(", ")}` : "Rate-limit headers: none sent, so the limit is unknown.")
  if (res.headers.get("location")) lines.push(`Redirects to: ${res.headers.get("location")}`)
  if (!rate.length) lines.push("Ask the upstream for its documented limit before putting it behind a paid tool.")
  return lines.join("\n")
}

// ---------------------------------------------------------------------------
// audit_endpoint
// ---------------------------------------------------------------------------

interface Finding { severity: "high" | "medium" | "low"; message: string }

const isSnake = (name: string) => /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/.test(name)
const isCamel = (name: string) => /^[a-z][a-zA-Z0-9]*$/.test(name) && /[A-Z]/.test(name)
const isKebab = (name: string) => /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(name)

function analyseTools(tools: McpTool[]): Finding[] {
  const findings: Finding[] = []
  const names = tools.map((t) => t.name)

  if (tools.length < 6) {
    findings.push({ severity: "high", message: `Only ${tools.length} tool(s). A paid MCP server needs at least 6 to be worth a buyer's attention.` })
  }

  const duplicates = names.filter((name, i) => names.indexOf(name) !== i)
  if (duplicates.length) findings.push({ severity: "high", message: `Duplicate tool name(s): ${[...new Set(duplicates)].join(", ")}` })

  const styles = new Set<string>()
  for (const name of names) {
    if (isKebab(name)) styles.add("kebab-case")
    else if (isSnake(name)) styles.add("snake_case")
    else if (isCamel(name)) styles.add("camelCase")
  }
  if (styles.size > 1) {
    findings.push({ severity: "medium", message: `Tool names mix ${[...styles].join(" and ")}, which reads as several authors. Pick one style.` })
  }

  const skinny = tools.filter((t) => (t.description ?? "").trim().length < 30)
  if (skinny.length) {
    findings.push({ severity: "medium", message: `${skinny.length} tool(s) have a description under 30 characters, so a model has little to route on: ${skinny.map((t) => t.name).slice(0, 6).join(", ")}` })
  }

  const noAnnotations = tools.filter((t) => !t.annotations)
  if (noAnnotations.length) {
    findings.push({ severity: "medium", message: `${noAnnotations.length} tool(s) declare no annotations, so a client cannot tell they are read-only: ${noAnnotations.map((t) => t.name).slice(0, 6).join(", ")}` })
  }

  const undescribed = tools.filter((t) => {
    const props = t.inputSchema?.properties ?? {}
    return Object.values(props).some((p) => !(p.description ?? "").trim())
  })
  if (undescribed.length) {
    findings.push({ severity: "medium", message: `${undescribed.length} tool(s) have parameters with no description, which is where example values belong: ${undescribed.map((t) => t.name).slice(0, 6).join(", ")}` })
  }

  const exampleLess = tools.filter((t) => {
    const text = `${t.description ?? ""} ${Object.values(t.inputSchema?.properties ?? {}).map((p) => p.description ?? "").join(" ")}`
    return text.length > 30 && !/for example|e\.g\.|such as|like /i.test(text)
  })
  if (exampleLess.length > tools.length / 2) {
    findings.push({ severity: "low", message: `${exampleLess.length} of ${tools.length} tool(s) show no example argument. Examples are what stop a model guessing a value that returns nothing.` })
  }

  const noArg = tools.filter((t) => !Object.keys(t.inputSchema?.properties ?? {}).length)
  if (noArg.length) {
    findings.push({ severity: "low", message: `${noArg.length} tool(s) take no arguments at all: ${noArg.map((t) => t.name).slice(0, 6).join(", ")}. Check that is deliberate.` })
  }

  const arrayParams = tools.flatMap((t) =>
    Object.entries(t.inputSchema?.properties ?? {})
      .filter(([, p]) => p.type === "array" && !/\bup to\b|\b\d{1,3}\b/.test(p.description ?? ""))
      .map(([name]) => `${t.name}.${name}`))
  if (arrayParams.length) {
    findings.push({ severity: "medium", message: `Unbounded array parameter(s) with no stated cap: ${arrayParams.slice(0, 6).join(", ")}. Say "up to N", or a caller can ask for too much.` })
  }

  return findings
}

const SEVERITY_ORDER: Record<Finding["severity"], number> = { high: 0, medium: 1, low: 2 }

interface Inventory {
  where: string
  serverName: string
  serverVersion: string
  protocolVersion: string
  tools: McpTool[]
  note: string
}

/** Reads a pasted tools/list payload: either the reply or the bare array. */
function parseToolsPayload(text: string, where: string): Inventory {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (e) {
    throw new Error(`That is not valid JSON: ${errorMessage(e)}`)
  }
  const holder = parsed as { tools?: unknown; result?: { tools?: unknown } }
  const raw = Array.isArray(parsed) ? parsed : (holder.tools ?? holder.result?.tools)
  if (!Array.isArray(raw)) {
    throw new Error('Expected a tools/list reply: either {"tools": [...]}, the whole {"result": {"tools": [...]}} message, or a bare array.')
  }
  return {
    where,
    serverName: "(from the pasted payload)",
    serverVersion: "",
    protocolVersion: "not applicable, nothing was contacted",
    tools: raw as McpTool[],
    note: "Read from the payload you supplied; no endpoint was contacted.",
  }
}

async function resolveInventory(value: string, label: string): Promise<Inventory> {
  const text = (value ?? "").trim()
  if (!text) throw new Error(`Provide ${label}: an MCP endpoint URL, or a tools/list JSON payload.`)
  if (text.startsWith("{") || text.startsWith("[")) return parseToolsPayload(text, label)
  const url = normalizeTarget(text).toString()
  const inv = await mcpInventory(url, 3)
  return {
    where: url,
    serverName: inv.serverName,
    serverVersion: inv.serverVersion,
    protocolVersion: inv.protocolVersion,
    tools: inv.tools,
    note: `Read live on attempt ${inv.attempts}.`,
  }
}

async function reportInventory(inv: Inventory): Promise<string> {
  const findings = analyseTools(inv.tools).sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])

  const lines = [
    `MCP audit for ${inv.where}`,
    `Server: ${inv.serverName}${inv.serverVersion ? ` ${inv.serverVersion}` : ""} | protocol ${inv.protocolVersion}`,
    `${inv.tools.length} tool(s). ${inv.note}`,
    "",
    "Tools:",
  ]
  for (const tool of inv.tools) {
    const required = tool.inputSchema?.required ?? []
    const optional = Object.keys(tool.inputSchema?.properties ?? {}).filter((p) => !required.includes(p))
    lines.push(`  ${tool.name}`)
    lines.push(`    ${(tool.description ?? "(no description)").slice(0, 160)}`)
    lines.push(`    required: ${required.join(", ") || "none"}${optional.length ? ` | optional: ${optional.join(", ")}` : ""}${tool.annotations ? ` | annotations: ${Object.keys(tool.annotations).join(", ")}` : " | no annotations"}`)
  }

  lines.push("")
  if (!findings.length) {
    lines.push("No problems found. Tool count, naming, descriptions, annotations and parameter caps all check out.")
  } else {
    const high = findings.filter((f) => f.severity === "high").length
    lines.push(`Found ${findings.length} issue(s)${high ? `, ${high} of them serious:` : ":"}`)
    for (const f of findings) lines.push(`  [${f.severity.toUpperCase()}] ${f.message}`)
  }
  return lines.join("\n")
}

export async function auditEndpoint(args: { url: string }): Promise<string> {
  return reportInventory(await resolveInventory(args.url, "url"))
}

/**
 * The same audit, run on a tools/list payload instead of a live endpoint. Works
 * for endpoints behind credentials, for a draft before it is deployed, and for
 * anything you can copy out of a client.
 */
export async function auditTools(args: { tools: string; label?: string }): Promise<string> {
  const label = (args.label ?? "pasted tools/list payload").trim()
  return reportInventory(parseToolsPayload(args.tools ?? "", label))
}

// ---------------------------------------------------------------------------
// compare_servers
// ---------------------------------------------------------------------------

export async function compareServers(args: { a: string; b: string }): Promise<string> {
  const [invA, invB] = await Promise.all([resolveInventory(args.a, "a"), resolveInventory(args.b, "b")])
  const a = invA.where
  const b = invB.where

  const setA = new Set(invA.tools.map((t) => t.name))
  const setB = new Set(invB.tools.map((t) => t.name))
  const shared = [...setA].filter((name) => setB.has(name)).sort()
  const onlyA = [...setA].filter((name) => !setB.has(name)).sort()
  const onlyB = [...setB].filter((name) => !setA.has(name)).sort()
  const union = new Set([...setA, ...setB])
  const overlap = union.size ? Math.round((shared.length / union.size) * 100) : 0

  const verdict = overlap >= 60
    ? "NEAR DUPLICATES — these two serve almost the same tools, so they compete with each other rather than covering different ground."
    : overlap >= 30
      ? "PARTIAL OVERLAP — a shared core with distinct extras. Fine if the extras are the selling point."
      : "DISTINCT — little shared surface."

  return [
    `Tool overlap: ${overlap}% (${shared.length} of ${union.size} distinct name(s) appear in both)`,
    verdict,
    "",
    `${a} — ${invA.tools.length} tool(s), server ${invA.serverName}`,
    `${b} — ${invB.tools.length} tool(s), server ${invB.serverName}`,
    "",
    "A and B each accept an endpoint URL or a pasted tools/list payload.",
    "",
    `Shared (${shared.length}): ${shared.join(", ") || "none"}`,
    `Only in A (${onlyA.length}): ${onlyA.join(", ") || "none"}`,
    `Only in B (${onlyB.length}): ${onlyB.join(", ") || "none"}`,
  ].join("\n")
}

// ---------------------------------------------------------------------------
// check_listing
// ---------------------------------------------------------------------------

// Verified against https://api.apify.com/v2/store?category=<value>: a valid value
// answers HTTP 200, an unknown one HTTP 400. There is no SECURITY category.
const CATEGORIES = [
  "AGENTS", "AI", "AUTOMATION", "DEVELOPER_TOOLS", "ECOMMERCE", "EDUCATION",
  "GAMES", "JOBS", "LEAD_GENERATION", "MARKETING", "MCP_SERVERS", "NEWS",
  "OTHER", "REAL_ESTATE", "SEO_TOOLS", "SOCIAL_MEDIA", "SPORTS", "TRAVEL",
]

const LIMITS: Array<{ field: string; limit: number; why: string }> = [
  { field: "title", limit: 63, why: "the Store cuts longer titles" },
  { field: "seoTitle", limit: 60, why: "search results cut longer titles" },
  { field: "seoDescription", limit: 160, why: "search results cut longer descriptions" },
  { field: "description", limit: 300, why: "the Store overview stops at 300 characters" },
]

export async function checkListing(args: {
  title?: string
  seoTitle?: string
  seoDescription?: string
  description?: string
  categories?: string[]
}): Promise<string> {
  const rows: string[] = []
  const problems: string[] = []
  const width = Math.max(...LIMITS.map((l) => l.field.length))

  for (const { field, limit, why } of LIMITS) {
    const value = (args[field as keyof typeof args] as string | undefined) ?? ""
    if (!value) {
      problems.push(`${field} is empty and is required.`)
      rows.push(`FAIL ${field.padEnd(width)}  missing — ${why}`)
      continue
    }
    const over = value.length > limit
    if (over) problems.push(`${field} is ${value.length} characters, ${value.length - limit} over the ${limit} limit.`)
    rows.push(`${over ? "FAIL" : "pass"} ${field.padEnd(width)}  ${String(value.length).padStart(3)}/${limit} characters${over ? ` — ${value.length - limit} over, ${why}` : ""}`)
  }

  const cats = (args.categories ?? []).map((c) => c.trim().toUpperCase()).filter(Boolean)
  if (!cats.length) {
    problems.push("categories is empty and is required.")
    rows.push(`FAIL categories  missing`)
  } else {
    if (cats.length > 3) problems.push(`${cats.length} categories given, but the maximum is 3.`)
    const unknown = cats.filter((c) => !CATEGORIES.includes(c))
    if (unknown.length) problems.push(`${unknown.join(", ")} is not an Apify category. Not every plausible name exists — SECURITY, FINANCE and CRYPTO are all rejected.`)
    rows.push(`${cats.length > 3 || unknown.length ? "FAIL" : "pass"} categories  ${cats.join(", ")}`)
  }

  return [
    "Listing check",
    problems.length ? `${problems.length} problem(s) that would fail a push:` : "All fields are inside the limits.",
    "",
    ...rows,
    "",
    problems.length ? "Problems:\n" + problems.map((p) => `  - ${p}`).join("\n") : `Allowed categories: ${CATEGORIES.join(", ")}`,
  ].join("\n")
}

// ---------------------------------------------------------------------------
// lint_source
// ---------------------------------------------------------------------------

/**
 * Replaces the body of every comment, string and template literal with filler of
 * the same length, so no structural pattern can be matched by text that merely
 * describes or generates it. Length is preserved on purpose: a site can then be
 * located in the masked copy and its real text read from the original at the same
 * offset. Without this the linter flags its own rule definitions, and any file
 * that generates code inside a string looks like it contains that code.
 */
/**
 * Walks the source once, tracking what it is inside, and returns a copy of the same
 * length where every comment, string, template and regex literal is blanked.
 * Length is preserved on purpose: a call site can then be located in the masked copy
 * and its real text read from the original at the same offset.
 *
 * A single pass is what makes this safe. Chaining regular expressions over the whole
 * file cannot work, because the constructs are mutually ambiguous without state: a
 * string may contain /* (which looks like a comment), a regex may contain quotes, and
 * a template may contain both. Each of those mistakes silently blanks real code, and
 * the linter then reports code that exists as missing.
 */
function masked(source: string): string {
  const chars = source.split("")
  const n = chars.length
  const paint = (from: number, to: number, filler: string) => {
    for (let i = from; i < to && i < n; i += 1) chars[i] = filler
  }

  /** A slash opens a regex only where a value is expected; after an identifier it divides. */
  const regexAllowed = (index: number): boolean => {
    let j = index - 1
    while (j >= 0 && /\s/.test(chars[j])) j -= 1
    if (j < 0) return true
    if (/[(,=:[!&|?{};+\-*%<>~^]/.test(chars[j])) return true
    let word = ""
    while (j >= 0 && /[A-Za-z]/.test(chars[j])) {
      word = chars[j] + word
      j -= 1
    }
    return word === "return" || word === "typeof" || word === "case" || word === "in"
  }

  const lineComment = (i: number): number => {
    const end = source.indexOf("\n", i)
    const stop = end === -1 ? n : end
    paint(i, stop, " ")
    return stop
  }

  const blockComment = (i: number): number => {
    const end = source.indexOf("*/", i + 2)
    const stop = end === -1 ? n : end + 2
    paint(i, stop, " ")
    return stop
  }

  /** Past the closing quote. Delimiters are kept so offsets stay comparable. */
  const scanString = (start: number): number => {
    const quote = chars[start]
    let k = start + 1
    while (k < n) {
      if (chars[k] === "\\") {
        k += 2
        continue
      }
      if (chars[k] === quote || chars[k] === "\n") break
      k += 1
    }
    paint(start + 1, Math.min(k, n), "x")
    return k + 1
  }

  const scanRegex = (start: number): number => {
    let k = start + 1
    let inClass = false
    while (k < n) {
      const c = chars[k]
      if (c === "\\") {
        k += 2
        continue
      }
      if (c === "\n") break
      if (c === "[") inClass = true
      else if (c === "]") inClass = false
      else if (c === "/" && !inClass) break
      k += 1
    }
    paint(start, Math.min(k + 1, n), " ")
    return k + 2
  }

  /**
   * Past the matching closing brace of an interpolation, with the ${ and } swallowed as
   * text. The expression inside is ordinary code, so it is walked rather than blanked —
   * identifiers used only inside an interpolation are real references.
   */
  const scanExpression = (start: number): number => {
    let k = start
    let depth = 1
    while (k < n) {
      const c = chars[k]
      const next = chars[k + 1]
      if (c === "{") {
        depth += 1
        k += 1
        continue
      }
      if (c === "}") {
        depth -= 1
        k += 1
        if (depth === 0) return k
        continue
      }
      if (c === "`") {
        k = scanTemplate(k)
        continue
      }
      if (c === '"' || c === "'") {
        k = scanString(k)
        continue
      }
      if (c === "\\") {
        k += 2
        continue
      }
      if (c === "/" && next === "/") {
        k = lineComment(k)
        continue
      }
      if (c === "/" && next === "*") {
        k = blockComment(k)
        continue
      }
      if (c === "/" && regexAllowed(k)) {
        k = scanRegex(k)
        continue
      }
      k += 1
    }
    return k
  }

  /**
   * Past the closing backtick. Nested backticks are the reason this needs its own pass:
   * a template inside an interpolation would otherwise be taken for the end of the outer
   * one, and every construct after it would be read from the wrong place.
   */
  function scanTemplate(start: number): number {
    let k = start + 1
    let textStart = k
    while (k < n) {
      const c = chars[k]
      if (c === "\\") {
        k += 2
        continue
      }
      if (c === "`") {
        paint(textStart, k, "x")
        return k + 1
      }
      if (c === "$" && chars[k + 1] === "{") {
        paint(textStart, k + 2, "x")
        const end = scanExpression(k + 2)
        // The brace that closes the interpolation is template syntax, not code. Leaving it
        // in place puts an unmatched } into the masked copy, and anything that counts
        // brackets afterwards — argument splitting, for one — silently reads it as code.
        paint(end - 1, end, "x")
        k = end
        textStart = k
        continue
      }
      k += 1
    }
    paint(textStart, n, "x")
    return n
  }

  let i = 0
  while (i < n) {
    const c = chars[i]
    const next = chars[i + 1]
    if (c === "/" && next === "/") {
      i = lineComment(i)
      continue
    }
    if (c === "/" && next === "*") {
      i = blockComment(i)
      continue
    }
    if (c === '"' || c === "'") {
      i = scanString(i)
      continue
    }
    if (c === "`") {
      i = scanTemplate(i)
      continue
    }
    if (c === "/" && regexAllowed(i)) {
      i = scanRegex(i)
      continue
    }
    i += 1
  }

  return chars.join("")
}

/**
 * Reads the real string literal that follows each match of `pattern`, whose last
 * group must capture the opening quote. Sites come from the masked copy, text from
 * the original, and the offset-preserving mask keeps the two aligned.
 */
function literalsAfter(source: string, maskedSource: string, pattern: RegExp): string[] {
  const out: string[] = []
  let match: RegExpExecArray | null
  while ((match = pattern.exec(maskedSource)) !== null) {
    const quote = match[match.length - 1]
    const start = match.index + match[0].length
    const end = source.indexOf(quote, start)
    if (end > start) out.push(source.slice(start, end))
  }
  return out
}

/**
 * Offset just past the closing quote of one literal, skipping escaped quotes. -1 when
 * the literal never closes on its own line, which means the read is out of bounds and
 * the caller must not slice anything.
 */
function closingQuote(source: string, from: number, quote: string): number {
  for (let i = from; i < source.length; i += 1) {
    const c = source[i]
    if (c === "\\") {
      i += 1
      continue
    }
    if (c === quote) return i
    if (c === "\n" && quote !== "`") return -1
  }
  return -1
}

/**
 * The text of a literal that may be wrapped over several lines with `+`. To a client a
 * wrapped description is one string, so it has to be one string here too: reading only
 * the first fragment made this linter report finished descriptions as unfinished (a
 * description ending "... for a domain, " + "and whether any authority is allowed." is
 * a complete sentence).
 *
 * `runOn` reports a join whose halves both miss the space that belongs between them,
 * which ships "current prices" and "and discounts" as "current pricesand discounts".
 */
function joinedLiteral(
  source: string,
  from: number,
  quote: string,
): { text: string; runOn: boolean; end: number } {
  let text = ""
  let runOn = false
  let cursor = from
  let lastEnd = from
  for (let hop = 0; hop < 40; hop += 1) {
    const end = closingQuote(source, cursor, quote)
    if (end === -1) break
    lastEnd = end
    const piece = source.slice(cursor, end)
    if (text && piece && !/\s$/.test(text) && !/^\s/.test(piece)) runOn = true
    text += piece
    let next = end + 1
    while (next < source.length && /\s/.test(source[next])) next += 1
    if (source[next] !== "+") return { text, runOn, end: lastEnd }
    next += 1
    while (next < source.length && /\s/.test(source[next])) next += 1
    if (source[next] !== quote) return { text, runOn, end: lastEnd }
    cursor = next + 1
  }
  return { text, runOn, end: lastEnd }
}

/**
 * The same `describe()` literals as literalsAfter, each paired with the parameter
 * name in front of it, so a finding can be located instead of only counted. The name
 * is read from the masked copy (the literal is blank there, but the `name:` key that
 * precedes it is real code) and the text from the original.
 */
function describedParams(
  source: string,
  maskedSource: string,
  pattern: RegExp,
): { name: string; text: string }[] {
  const out: { name: string; text: string }[] = []
  let match: RegExpExecArray | null
  while ((match = pattern.exec(maskedSource)) !== null) {
    const quote = match[match.length - 1]
    const start = match.index + match[0].length
    const read = joinedLiteral(source, start, quote)
    if (read.end <= start) continue
    // Bounded window: `name: z.string().` sits immediately before the call, and
    // scanning the whole prefix for every match would be quadratic.
    const window = maskedSource.slice(Math.max(0, match.index - 200), match.index)
    const name = /([A-Za-z_][A-Za-z0-9_]*)\s*:\s*[^,;{}]*$/.exec(window)?.[1] ?? ""
    out.push({ name, text: read.text })
  }
  return out
}

/**
 * Tools whose own description says too little to choose them by.
 *
 * Parameter descriptions are not the only thing a model reads: a tool description is
 * how it decides to call this tool instead of its neighbour, so "Active visitors."
 * costs calls. Each registration is judged on the text between it and the next one,
 * which is where its `description:` property lives.
 */
function toolDescriptions(source: string, maskedSource: string): { name: string; text: string; runOn: boolean }[] {
  const out: { name: string; text: string; runOn: boolean }[] = []
  const pattern = /registerTool\(\s*(["'`])/g
  const starts: { name: string; at: number }[] = []
  let match: RegExpExecArray | null
  while ((match = pattern.exec(maskedSource)) !== null) {
    const quote = match[match.length - 1]
    const start = match.index + match[0].length
    const end = source.indexOf(quote, start)
    const name = source.slice(start, end)
    if (name && !name.includes("\n")) starts.push({ name, at: match.index })
  }
  starts.forEach((entry, i) => {
    const to = i + 1 < starts.length ? starts[i + 1].at : maskedSource.length
    const block = maskedSource.slice(entry.at, to)
    const property = /description\s*:\s*(["'`])/.exec(block)
    if (!property) return
    const from = entry.at + property.index + property[0].length
    const quote = property[1]
    const read = joinedLiteral(source, from, quote)
    if (!read.text) return
    out.push({ name: entry.name, text: read.text, runOn: read.runOn })
  })
  return out
}

function thinToolDescriptions(source: string, maskedSource: string, min: number): { name: string; text: string }[] {
  return toolDescriptions(source, maskedSource).filter((t) => t.text.trim().length < min)
}

export async function lintSource(args: { source: string; label?: string }): Promise<string> {
  const source = args.source ?? ""
  if (!source.trim()) throw new Error("Paste the TypeScript source of an MCP server to lint.")
  const label = (args.label ?? "pasted source").trim()
  const findings: Finding[] = []
  const code = masked(source)

  const registrations = literalsAfter(source, code, /registerTool\(\s*(["'`])/g).filter((name) => name && !name.includes("\n"))
  const looseCalls = (code.match(/(?<!register)\btool\(\s*["'`]/g) ?? []).length
  const toolCount = registrations.length + looseCalls

  // A server package splits into the file that registers tools and the module that
  // does the work. Only the first one can be judged on tool count, annotations and
  // handler shape; judging an API module on those is noise, not a finding.
  const looksLikeServer = registrations.length > 0 || /new McpServer\(/.test(code)
  const skipped: string[] = []

  if (!looksLikeServer) {
    skipped.push(`no tool registrations in this file (it looks like an API module, not the server file), so tool count, naming, annotations and handler shape were not judged`)
  } else if (toolCount < 6) {
    findings.push({ severity: "high", message: `Only ${toolCount} tool(s). A paid server wants at least 6.` })
  }

  if (looksLikeServer) {
    const thinTools = thinToolDescriptions(source, code, 30)
    if (thinTools.length) {
      const shown = thinTools.slice(0, 10)
      const named = shown.map((t) => `${t.name} ${JSON.stringify(t.text.trim())}`).join(", ")
      const more = thinTools.length > shown.length ? `, +${thinTools.length - shown.length} more` : ""
      findings.push({ severity: "medium", message: `${thinTools.length} tool description(s) are under 30 characters, so a model cannot tell them apart: ${named}${more}.` })
    }
  }

  if (looksLikeServer) {
    // A description that stops on "... instant-buy price," reads as unfinished to a model
    // and to a buyer reading the listing. Fragments joined with `+` are read as the one
    // sentence the client sees, so a correctly wrapped description is not reported here.
    const unfinished = toolDescriptions(source, code).filter((t) => t.text.trim() && !/[.!?]$/.test(t.text.trim()))
    if (unfinished.length) {
      const shown = unfinished.slice(0, 10)
      const named = shown.map((t) => `${t.name} ${JSON.stringify(t.text.trim().slice(-30))}`).join(", ")
      const more = unfinished.length > shown.length ? `, +${unfinished.length - shown.length} more` : ""
      findings.push({ severity: "medium", message: `${unfinished.length} tool description(s) do not end in a sentence: ${named}${more}.` })
    }

    // Two halves of a wrapped description that both miss the joining space ship as
    // "pricesand discounts", which reads as a typo in the listing and in the tool list.
    const runOn = toolDescriptions(source, code).filter((t) => t.runOn)
    if (runOn.length) {
      const shown = runOn.slice(0, 10)
      const named = shown.map((t) => t.name).join(", ")
      const more = runOn.length > shown.length ? `, +${runOn.length - shown.length} more` : ""
      findings.push({ severity: "low", message: `${runOn.length} tool description(s) join wrapped fragments without a space, so the words run together: ${named}${more}.` })
    }
  }

  const dupeTools = registrations.filter((name, i) => registrations.indexOf(name) !== i)
  if (dupeTools.length) findings.push({ severity: "high", message: `Duplicate tool name(s): ${[...new Set(dupeTools)].join(", ")}.` })

  if (looksLikeServer) {
    // Every registration block between one registerTool( and the next.
    // A block runs from one registerTool( to the next. Inside it, everything before
    // the handler is the options object and everything after is the handler, so each
    // check looks at the right half instead of guessing a character window.
    const blocks = code.split(/registerTool\(/).slice(1)
    const headOf = (block: string) => block.split(/async\s*\(/)[0]
    const tailOf = (block: string) => block.split(/async\s*\(/).slice(1).join("")

    const noAnnotations = blocks.filter((block) => !/annotations\s*:/.test(headOf(block)))
    if (noAnnotations.length) findings.push({ severity: "medium", message: `${noAnnotations.length} tool(s) declare no annotations (readOnlyHint, openWorldHint).` })

    // Only handlers that await something can fail from upstream. A handler that formats a
    // constant cannot throw, and wrapping it in a catch would be noise rather than safety.
    const noTry = blocks.filter((block) => {
      const body = tailOf(block)
      return /\bawait\b/.test(body) && !/try\s*\{/.test(body)
    })
    if (noTry.length) findings.push({ severity: "medium", message: `${noTry.length} tool handler(s) reach upstream with no try/catch, so a failure escapes as a raw exception.` })
  }

  // fetch(...) with no abort signal anywhere near it. Without one a hung upstream holds
  // the tool open until the MCP client gives up, so the run never returns a clean error.
  // The negative lookbehind matters: a method like board.fetch(...) is a caller's own
  // function, not an HTTP call, and flagging it invents a defect that is not there.
  const fetches = [...code.matchAll(/(?<![.\w])fetch\(/g)]

  /** The text between the call's own parentheses. */
  const argsOf = (open: number): string | null => {
    let depth = 0
    for (let i = open; i < code.length; i += 1) {
      if (code[i] === "(") depth += 1
      else if (code[i] === ")") {
        depth -= 1
        if (depth === 0) return code.slice(open + 1, i)
      }
    }
    return null
  }

  /** The options argument, i.e. everything after the comma that separates the arguments. */
  const secondArg = (args: string): string => {
    let depth = 0
    for (let i = 0; i < args.length; i += 1) {
      const c = args[i]
      if (c === "(" || c === "[" || c === "{") depth += 1
      else if (c === ")" || c === "]" || c === "}") depth -= 1
      else if (c === "," && depth === 0) return args.slice(i + 1).trim()
    }
    return ""
  }

  // The signal belongs to the fetch call's own options, so read that argument. A fixed
  // window of following characters reports a missing signal on a call that carries one a
  // few lines further down, and a reader cannot act on a finding like that.
  let noTimeout = 0
  for (const match of fetches) {
    const args = argsOf((match.index ?? 0) + match[0].length - 1)
    if (args === null) continue
    const options = secondArg(args)
    if (!options) noTimeout += 1
    else if (options.startsWith("{")) {
      if (!/signal\s*:/.test(options)) noTimeout += 1
    } else if (!/signal\s*:/.test(code)) {
      // The options are built elsewhere. Only complain when no signal exists anywhere.
      noTimeout += 1
    }
  }
  if (noTimeout) findings.push({ severity: "medium", message: `${noTimeout} fetch call(s) pass no signal, so a slow upstream hangs the tool until the client gives up.` })

  const hardSuppressions = (code.match(/@ts-ignore|@ts-expect-error|as any\b/g) ?? []).length
  if (hardSuppressions) findings.push({ severity: "high", message: `${hardSuppressions} hard type-suppression(s): @ts-ignore, @ts-expect-error or as any. Each one hides a real type error from the compiler.` })

  const doubleAssertions = (code.match(/as unknown as/g) ?? []).length
  if (doubleAssertions) findings.push({ severity: "low", message: `${doubleAssertions} double assertion(s) (as unknown as). Legitimate for shaping untyped upstream data, but checking is off for that value, so keep it next to the fetch it guards.` })

  const logs = (code.match(/console\.(log|debug)\(/g) ?? []).length
  if (logs) findings.push({ severity: "low", message: `${logs} console.log/debug call(s) left in the source.` })

  // A marker only counts when the comment starts the line and the marker starts the
  // comment ("// TODO: fix this"), which is how unfinished work is actually noted.
  // Prose that mentions the word, which is how a checker describes the rule, is not.
  const todos = (source.match(/^[ \t]*\/\/[ \t]*(TODO|FIXME|XXX)[:(]|^[ \t]*\/\*[ \t]*(TODO|FIXME|XXX)[:(]/gm) ?? []).length
  const stubs = literalsAfter(source, code, /throw new Error\(\s*(["'`])/g)
    .filter((message) => /not implemented|unimplemented|todo/i.test(message)).length
  if (todos) findings.push({ severity: "high", message: `${todos} TODO or FIXME comment(s). A paid tool must ship finished.` })
  if (stubs) findings.push({ severity: "high", message: `${stubs} placeholder implementation(s): a tool that throws "not implemented" is a stub, not a feature.` })

  // Dead code, but only what one file can prove. An exported symbol may well be
  // imported by the sibling file, so a single-file scan cannot call it dead — only
  // declarations with no export keyword are conclusive.
  // Uses are counted on the masked code plus the ${...} bodies of template literals.
  // Masking blanks a template whole, so a name used only inside one — which is where
  // UA, a timeout and a reply object usually end up — would look unreferenced.
  const interpolationCode = [...source.matchAll(/\$\{([^}]*)\}/g)].map((m) => m[1]).join("\n")
  const codeForUses = `${code}\n${interpolationCode}`

  const localDecls = [...code.matchAll(/^(?!\s*export\b)\s*(?:async\s+)?(?:function|const|let|class|interface|type)\s+([A-Za-z_][A-Za-z0-9_]*)/gm)].map((m) => m[1])
  const deadLocal = localDecls.filter((name) => {
    const uses = codeForUses.match(new RegExp(`\\b${name}\\b`, "g")) ?? []
    return uses.length <= 1
  })
  if (deadLocal.length) {
    findings.push({ severity: "medium", message: `Declared here, never referenced again, and not exported: ${[...new Set(deadLocal)].slice(0, 10).join(", ")}. Nothing can reach these, so they are dead.` })
  }
  const exportedCount = [...code.matchAll(/^\s*export\s+(?:async\s+)?(?:function|const|let|class|interface|type)\s+([A-Za-z_][A-Za-z0-9_]*)/gm)].length
  if (exportedCount) {
    skipped.push(`${exportedCount} exported declaration(s) were left alone: a single file cannot tell whether another file imports them`)
  }

  // Only descriptions that say nothing at all. An earlier version tried to detect a
  // missing example, but stating a limit, an allowed set or a default is just as
  // useful, and judging that needs semantics a linter does not have.
  const described = describedParams(source, code, /describe\(\s*(["'`])/g)
  const bare = described.filter((d) => d.text.trim().length < 12)
  if (bare.length) {
    const shown = bare.slice(0, 12)
    const named = shown.map((d) => `${d.name || "(unnamed)"} ${JSON.stringify(d.text.trim())}`).join(", ")
    const more = bare.length > shown.length ? `, +${bare.length - shown.length} more` : ""
    findings.push({ severity: "low", message: `${bare.length} parameter description(s) are under 12 characters, which tells a model almost nothing: ${named}${more}.` })
  }

  const deduped = findings.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
  const counts = { high: 0, medium: 0, low: 0 }
  for (const f of deduped) counts[f.severity] += 1

  return [
    `Source lint for ${label}`,
    looksLikeServer
      ? `${toolCount} tool(s), ${source.split("\n").length} line(s) | findings: ${counts.high} high, ${counts.medium} medium, ${counts.low} low`
      : `API module, ${source.split("\n").length} line(s) | findings: ${counts.high} high, ${counts.medium} medium, ${counts.low} low`,
    registrations.length ? `Tools: ${registrations.join(", ")}` : "",
    "",
    deduped.length
      ? deduped.map((f) => `[${f.severity.toUpperCase()}] ${f.message}`).join("\n")
      : "Nothing found. The linter checks tool count, naming, annotations, try/catch, fetch timeouts, type suppressions, placeholder comments and dead local code.",
    skipped.length ? `\nNot checked:\n${skipped.map((s) => `  - ${s}`).join("\n")}` : "",
  ].filter((line) => line !== "").join("\n")
}

// ---------------------------------------------------------------------------
// generate_tool_registration
// ---------------------------------------------------------------------------

interface ParamSpec {
  name: string
  type?: string
  description: string
  optional?: boolean
}

interface ToolSpec {
  name: string
  title: string
  description: string
  params?: ParamSpec[]
}

const toFunctionName = (toolName: string) =>
  toolName.replace(/[-_]+([a-z0-9])/g, (_, c: string) => c.toUpperCase()).replace(/[-_]+/g, "")

const zodFor = (type: string) => {
  const kind = (type ?? "string").toLowerCase()
  if (kind === "number" || kind === "integer") return "z.number()"
  if (kind === "boolean") return "z.boolean()"
  if (kind === "array") return "z.array(z.string())"
  return "z.string()"
}

/**
 * Emits the complete server.ts registration block for a list of tools, in the
 * house style this repository uses. Every line it prints is final code: the only
 * thing it assumes is that api.ts exports one function per tool, named after the
 * tool in camelCase.
 */
export async function generateToolRegistration(args: { serverName: string; tools: ToolSpec[] }): Promise<string> {
  const name = (args.serverName ?? "").trim()
  if (!name) throw new Error("Provide the server name, for example weather-mcp.")
  if (!/^[a-z][a-z0-9-]*-mcp$/.test(name)) {
    throw new Error(`"${name}" does not look like a server name. Use lower-case words ending in -mcp, for example weather-mcp.`)
  }

  const tools = (args.tools ?? []).slice(0, 40)
  if (!tools.length) throw new Error("Provide at least one tool, each with a name, a title and a description.")
  for (const tool of tools) {
    if (!tool.name || !/^[a-z][a-z0-9_]*$/.test(tool.name)) {
      throw new Error(`Tool name "${tool.name ?? ""}" must be lower-case snake_case, for example search_items.`)
    }
    if (!tool.title || !tool.description) throw new Error(`Tool "${tool.name}" needs both a title and a description.`)
  }

  const functions = tools.map((t) => toFunctionName(t.name)).sort()
  const missing = functions.find((f) => !/^[a-z][A-Za-z0-9]*$/.test(f))
  if (missing) throw new Error(`Tool named "${missing}" cannot be turned into a function name.`)

  const lines = [
    'import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"',
    'import { z } from "zod"',
    "import {",
    ...functions.map((f) => `  ${f},`),
    '  errorMessage,',
    '} from "./api.js"',
    "",
    'const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })',
    'const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })',
    "const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const",
    "",
    "export function createServer(): McpServer {",
    `  const server = new McpServer({ name: "${name}", version: "1.0.0" })`,
  ]

  for (const tool of tools) {
    const params = tool.params ?? []
    lines.push("")
    lines.push("  server.registerTool(")
    lines.push(`    "${tool.name}",`)
    lines.push("    {")
    lines.push(`      title: ${JSON.stringify(tool.title)},`)
    lines.push(`      description: ${JSON.stringify(tool.description)},`)
    if (params.length) {
      lines.push("      inputSchema: z.object({")
      params.forEach((p, i) => {
        const chain = `${zodFor(p.type ?? "string")}.describe(${JSON.stringify(p.description)})${p.optional ? ".optional()" : ""}`
        lines.push(`        ${p.name}: ${chain}${i === params.length - 1 ? "" : ","}`)
      })
      lines.push("      }),")
    } else {
      lines.push("      inputSchema: z.object({}),")
    }
    lines.push("      annotations: READ_ONLY,")
    lines.push("    },")
    lines.push(`    async (args) => {`)
    lines.push(`      try { return text(await ${toFunctionName(tool.name)}(args)) } catch (e) { return textError(errorMessage(e)) }`)
    lines.push("    }")
    lines.push("  )")
  }

  lines.push("")
  lines.push("  return server")
  lines.push("}")

  return [
    `server.ts for ${name} — ${tools.length} tool(s), ready to use`,
    "",
    `Contract: api.ts must export ${functions.join(", ")}, each taking its argument object and returning a formatted string.`,
    "",
    "```ts",
    ...lines,
    "```",
  ].join("\n")
}

// ---------------------------------------------------------------------------
// diff_tool_schema
// ---------------------------------------------------------------------------

interface ToolShape {
  name: string
  required: string[]
  properties: Record<string, string>
}

function readToolList(input: string): ToolShape[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(input)
  } catch (e) {
    throw new Error(`That is not valid JSON: ${errorMessage(e)}`)
  }
  const holder = parsed as { tools?: unknown; result?: { tools?: unknown } }
  const raw = Array.isArray(parsed)
    ? parsed
    : (holder.tools ?? holder.result?.tools)
  if (!Array.isArray(raw)) throw new Error('Expected a tools/list reply: either {"tools": [...]} or the whole {"result": {"tools": [...]}} message.')
  return (raw as McpTool[]).map((tool) => ({
    name: String(tool.name),
    required: [...(tool.inputSchema?.required ?? [])],
    properties: Object.fromEntries(
      Object.entries(tool.inputSchema?.properties ?? {}).map(([key, value]) => [key, String(value?.type ?? "any")]),
    ),
  }))
}

/**
 * Compares two tools/list payloads and separates what breaks existing callers
 * from what is safe to ship.
 */
export async function diffToolSchema(args: { before: string; after: string }): Promise<string> {
  const before = readToolList(args.before ?? "")
  const after = readToolList(args.after ?? "")
  const beforeByName = new Map(before.map((t) => [t.name, t]))
  const afterByName = new Map(after.map((t) => [t.name, t]))

  const removed = before.filter((t) => !afterByName.has(t.name)).map((t) => t.name)
  const added = after.filter((t) => !beforeByName.has(t.name)).map((t) => t.name)
  const breaking: string[] = []
  const safe: string[] = []

  for (const oldTool of before) {
    const newTool = afterByName.get(oldTool.name)
    if (!newTool) continue

    const newRequired = newTool.required.filter((p) => !oldTool.required.includes(p))
    if (newRequired.length) breaking.push(`${oldTool.name}: newly required parameter(s) ${newRequired.join(", ")} — calls written against the old schema will fail.`)

    const dropped = Object.keys(oldTool.properties).filter((p) => !(p in newTool.properties))
    if (dropped.length) breaking.push(`${oldTool.name}: parameter(s) removed ${dropped.join(", ")}.`)

    const retyped = Object.keys(oldTool.properties)
      .filter((p) => p in newTool.properties && newTool.properties[p] !== oldTool.properties[p])
      .map((p) => `${p} (${oldTool.properties[p]} -> ${newTool.properties[p]})`)
    if (retyped.length) breaking.push(`${oldTool.name}: parameter type changed for ${retyped.join(", ")}.`)

    const relaxed = oldTool.required.filter((p) => !newTool.required.includes(p))
    if (relaxed.length) safe.push(`${oldTool.name}: parameter(s) now optional ${relaxed.join(", ")}.`)

    const gained = Object.keys(newTool.properties).filter((p) => !(p in oldTool.properties))
    if (gained.length) safe.push(`${oldTool.name}: new optional parameter(s) ${gained.join(", ")}.`)
  }

  if (removed.length) breaking.unshift(`Tool(s) removed: ${removed.join(", ")}. Anything calling them breaks.`)
  if (added.length) safe.push(`Tool(s) added: ${added.join(", ")}.`)

  const verdict = breaking.length
    ? `BREAKING — ${breaking.length} change(s) can break an existing caller. Bump the major version and say so in the changelog.`
    : safe.length
      ? `COMPATIBLE — ${safe.length} additive change(s), nothing breaks an existing caller.`
      : "IDENTICAL — no difference in tools, parameters or types."

  return [
    `Schema diff: ${before.length} -> ${after.length} tool(s)`,
    verdict,
    "",
    breaking.length ? `Breaking (${breaking.length}):\n${breaking.map((b) => `  - ${b}`).join("\n")}` : "Breaking: none",
    "",
    safe.length ? `Compatible (${safe.length}):\n${safe.map((s) => `  - ${s}`).join("\n")}` : "Compatible: none",
  ].join("\n")
}
