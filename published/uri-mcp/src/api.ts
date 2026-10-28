/**
 * URL and Base64 Toolkit — keyless public API client.
 */
const BASE = "https://example.invalid"
const SOURCE = "URL and Base64 Toolkit"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "uri-mcp", accept },
    })
    if (!res.ok) throw new SourceError(`${SOURCE} responded ${res.status}`)
    return res
  } catch (e) {
    if (e instanceof SourceError) throw e
    if ((e as Error).name === "AbortError") throw new SourceError(`${SOURCE} request timed out`)
    throw new SourceError(`${SOURCE} request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

export async function getJson(path: string): Promise<any> {
  const res = await request(path)
  const body = await res.text()
  try {
    return JSON.parse(body)
  } catch {
    throw new SourceError(`${SOURCE} returned malformed JSON`)
  }
}

export async function getText(path: string, accept = "text/plain"): Promise<string> {
  const res = await request(path, accept)
  return (await res.text()).trim()
}

export function clampLimit(n: number | undefined, fallback: number, max: number): number {
  const v = n ?? fallback
  if (!Number.isInteger(v) || v < 1 || v > max) throw new SourceError(`limit must be between 1 and ${max}`)
  return v
}

export function clean(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim()
}

export function bullet(label: string, value: unknown): string {
  const v = value === undefined || value === null || value === "" ? "" : String(value)
  return v ? `${label}: ${v}` : ""
}

export function section(title: string, rows: string[]): string {
  return [title, ...rows.filter(Boolean)].join("\n")
}

function asUrl(input: string): URL {
  const text = clean(input)
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(text)) throw new SourceError(`"${text}" has no scheme - include http:// or https://`)
  try {
    return new URL(text)
  } catch {
    throw new SourceError(`"${text}" is not a valid absolute URL`)
  }
}

export async function parseUrl(a: { url: string }): Promise<string> {
  const u = asUrl(a.url)
  const params = [...u.searchParams.entries()]
  const duplicates = new Map<string, number>()
  for (const [key] of params) duplicates.set(key, (duplicates.get(key) ?? 0) + 1)
  return [
    `${u.href}`,
    "",
    `scheme: ${u.protocol.replace(":", "")}`,
    `host: ${u.hostname}${u.port ? ` · port ${u.port}` : " · default port"}`,
    u.username ? `credentials: ${u.username}${u.password ? `:${u.password.replace(/./g, "*")}` : ""} (present in the URL - avoid this in logs)` : "credentials: none",
    `path: ${u.pathname}`,
    u.hash ? `fragment: ${u.hash.slice(1)}` : "fragment: none",
    "the URL is absolute" ,
    "",
    params.length ? `Query parameters (${params.length}, decoded):` : "Query parameters: none",
    ...params.map(([key, value]) => `- ${key} = ${value}${(duplicates.get(key) ?? 0) > 1 ? " (repeated key)" : ""}`),
    "",
    `Encoded form of the query: ${u.search || "(none)"}`,
  ].join("\n")
}

export async function encodeUrl(a: { text: string; component?: boolean }): Promise<string> {
  const component = a.component !== false
  const encoded = component ? encodeURIComponent(a.text) : encodeURI(a.text)
  const changed = [...a.text].filter((ch) => !encoded.includes(ch)).length
  return [
    component ? "Encoded as a URL component (every reserved character escaped):" : "Encoded as a full URL (reserved characters kept):",
    encoded,
    "",
    `Input length ${a.text.length} · output length ${encoded.length} · ${changed} character(s) escaped`,
    component ? "Use this for a single query value or path segment." : "Use this when the text is already a URL and only spaces and non-ASCII need escaping.",
  ].join("\n")
}

export async function decodeUrl(a: { text: string }): Promise<string> {
  const text = a.text
  const bad: string[] = []
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "%") {
      const hex = text.slice(i + 1, i + 3)
      if (!/^[0-9a-fA-F]{2}$/.test(hex)) bad.push(`%${text.slice(i + 1, i + 4)}`)
    }
  }
  let decoded: string
  try {
    decoded = decodeURIComponent(text)
  } catch {
    throw new SourceError(`"${text}" contains malformed percent escapes: ${[...new Set(bad)].join(", ") || "unknown"}`)
  }
  return [
    "Decoded:",
    decoded,
    "",
    `Input length ${text.length} · output length ${decoded.length}${bad.length ? ` · ${bad.length} suspicious escape(s) tolerated` : ""}`,
    bad.length ? "Malformed escapes were left as-is by the decoder; check them before trusting the value." : "",
    decoded.includes("\u0000") ? "Warning: the decoded text contains a NUL byte." : "",
  ].filter(Boolean).join("\n")
}

export async function base64Encode(a: { text: string; urlSafe?: boolean }): Promise<string> {
  const urlSafe = a.urlSafe === true
  const encoded = Buffer.from(a.text, "utf8").toString("base64")
  const out = urlSafe ? encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : encoded
  return [
    urlSafe ? "base64url:" : "base64:",
    out,
    "",
    `Input ${Buffer.byteLength(a.text, "utf8")} byte(s) · output ${out.length} character(s)`,
    Buffer.byteLength(a.text, "utf8") !== a.text.length ? "The input has multi-byte characters, so byte length differs from character count." : "",
  ].filter(Boolean).join("\n")
}

export async function base64Decode(a: { text: string; urlSafe?: boolean }): Promise<string> {
  const urlSafe = a.urlSafe === true
  const raw = clean(a.text).replace(/\s+/g, "")
  const normalized = urlSafe ? raw.replace(/-/g, "+").replace(/_/g, "/") : raw
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) throw new SourceError("input is not valid base64")
  if (normalized.length % 4 === 1) throw new SourceError("base64 length is invalid - one character is missing or extra")
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4)
  const buffer = Buffer.from(padded, "base64")
  const roundTrip = buffer.toString("base64").replace(/=+$/, "")
  const ok = roundTrip === normalized.replace(/=+$/, "")
  const text = buffer.toString("utf8")
  const printable = !/[\u0000-\u0008\u000e-\u001f]/.test(text)
  return [
    "Decoded:",
    text,
    "",
    `${buffer.length} byte(s)${urlSafe ? " (base64url input)" : ""}`,
    ok ? "The input is canonical base64." : "Warning: the input was not canonical (padding or extra characters).",
    printable ? "The result is printable UTF-8 text." : "The result contains control characters, so the input was probably binary data.",
  ].join("\n")
}
