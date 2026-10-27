/**
 * Text Hashing — keyless public API client.
 */
const BASE = "https://example.invalid"
const SOURCE = "Text Hashing"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "hash-mcp", accept },
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

import { createHash, createHmac } from "node:crypto"

const ALGOS = ["md5", "sha1", "sha256", "sha384", "sha512"] as const
type Algo = typeof ALGOS[number]

function checkAlgo(value: string, all: readonly string[]): string {
  const algo = clean(value).toLowerCase()
  if (!all.includes(algo)) throw new SourceError(`algorithm must be one of ${all.join(", ")}`)
  return algo
}

function digest(algo: string, text: string): Buffer {
  return createHash(algo).update(text, "utf8").digest()
}

export async function hashText(a: { text: string; algorithm?: string }): Promise<string> {
  const algo = checkAlgo(a.algorithm ?? "sha256", ALGOS)
  const out = digest(algo, a.text)
  const notes = algo === "md5" ? ["MD5 is broken for security use - fine for checksums only."] : algo === "sha1" ? ["SHA-1 is considered broken for signatures; use SHA-256 for anything security related."] : []
  return [
    `${algo} of ${a.text.length} character(s)`,
    `hex:    ${out.toString("hex")}`,
    `base64: ${out.toString("base64")}`,
    `length: ${out.length * 8} bits`,
    ...notes,
    "",
    "Hashing happens locally; the text never leaves this machine.",
  ].join("\n")
}

export async function hashAll(a: { text: string }): Promise<string> {
  return [
    `Digests of ${a.text.length} character(s):`,
    "",
    ...ALGOS.map((algo) => {
      const out = digest(algo, a.text)
      return `- ${algo.padEnd(7)} ${out.toString("hex")}`
    }),
    "",
    "MD5 and SHA-1 are weak; SHA-256 and above are the safe choices for security.",
  ].join("\n")
}

export async function hmacText(a: { text: string; key: string; algorithm?: string }): Promise<string> {
  const algo = checkAlgo(a.algorithm ?? "sha256", ALGOS.filter((x) => x !== "md5"))
  const out = createHmac(algo, a.key).update(a.text, "utf8").digest()
  return [
    `hmac-${algo} (${out.length * 8} bit)`,
    `hex:    ${out.toString("hex")}`,
    `base64: ${out.toString("base64")}`,
    "",
    `Message: ${a.text.slice(0, 120)}${a.text.length > 120 ? "..." : ""}`,
    `Key length: ${a.key.length} character(s)`,
    "Comparison tip: compare digests with a constant-time check in the service that verifies them.",
  ].join("\n")
}
