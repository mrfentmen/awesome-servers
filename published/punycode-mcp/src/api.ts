/**
 * Punycode Domains — keyless public API client.
 */
import { domainToASCII, domainToUnicode as decodeDomain } from "node:url"

const BASE = "https://example.invalid"
const SOURCE = "Punycode Domains"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "punycode-mcp", accept },
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

function normaliseDomain(raw: string): string {
  const d = raw.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "").replace(/\.$/, "")
  if (!d) throw new SourceError("domain is empty")
  if (/\s/.test(d)) throw new SourceError("domain contains whitespace")
  if (d.length > 253) throw new SourceError("domain is longer than 253 characters")
  return d
}

export async function domainToAscii(a: { domain: string }): Promise<string> {
  const d = normaliseDomain(a.domain)
  const ascii = domainToASCII(d)
  if (!ascii) throw new SourceError(`"${a.domain}" is not a valid internationalised domain`)
  return [
    `Unicode: ${decodeDomain(ascii) || d}`,
    `ASCII: ${ascii}`,
    `Punycode labels: ${ascii.split(".").filter((l) => l.startsWith("xn--")).join(", ") || "none"}`,
  ].join("\n")
}

export async function domainToUnicodeTool(a: { domain: string }): Promise<string> {
  const d = normaliseDomain(a.domain)
  const ascii = domainToASCII(d)
  if (!ascii) throw new SourceError(`"${a.domain}" is not a valid domain`)
  const unicode = decodeDomain(ascii)
  return [
    `ASCII: ${ascii}`,
    `Unicode: ${unicode || ascii}`,
    `Changed: ${unicode && unicode !== ascii ? "yes" : "no"}`,
  ].join("\n")
}

export async function inspectDomain(a: { domain: string }): Promise<string> {
  const d = normaliseDomain(a.domain)
  const ascii = domainToASCII(d)
  if (!ascii) throw new SourceError(`"${a.domain}" is not a valid domain`)
  const labels = d.split(".")
  const rows = labels.map((label) => {
    const asciiLabel = domainToASCII(label)
    if (!asciiLabel) throw new SourceError(`label "${label}" is not valid`)
    return `${label}  ->  ${asciiLabel}${asciiLabel.startsWith("xn--") ? "  (punycode)" : ""}`
  })
  return [
    `Domain: ${d}`,
    `ASCII form: ${ascii}`,
    `Labels: ${labels.length}`,
    `TLD: ${labels[labels.length - 1]}`,
    "",
    ...rows,
    "",
    `Mixed scripts: ${/[\u0080-\uffff]/.test(d) ? "contains non-ASCII characters" : "ASCII only"}`,
  ].join("\n")
}
