/**
 * ISBN — keyless public API client.
 */
const BASE = "https://example.invalid"
const SOURCE = "ISBN"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "isbn-mcp", accept },
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

const DIGITS = /^[0-9Xx]+$/

function normalise(raw: string): string {
  const v = raw.replace(/[\s-]/g, "").toUpperCase()
  if (!DIGITS.test(v)) throw new SourceError(`"${raw}" contains characters that are not ISBN digits`)
  if (v.length !== 10 && v.length !== 13) throw new SourceError(`"${raw}" is ${v.length} characters; an ISBN has 10 or 13`)
  return v
}

function checksum10(v: string): boolean {
  let sum = 0
  for (let i = 0; i < 9; i++) sum += Number(v[i]) * (10 - i)
  const last = v[9] === "X" ? 10 : Number(v[9])
  return (sum + last) % 11 === 0
}

function checksum13(v: string): boolean {
  let sum = 0
  for (let i = 0; i < 12; i++) sum += Number(v[i]) * (i % 2 === 0 ? 1 : 3)
  return (10 - (sum % 10)) % 10 === Number(v[12])
}

function check(raw: string): { isbn: string; kind: "ISBN-10" | "ISBN-13"; valid: boolean; reason: string } {
  const v = normalise(raw)
  if (v.length === 10) {
    const valid = checksum10(v)
    return { isbn: v, kind: "ISBN-10", valid, reason: valid ? "checksum valid" : "checksum mismatch" }
  }
  const valid = checksum13(v)
  return { isbn: v, kind: "ISBN-13", valid, reason: valid ? "checksum valid" : "checksum mismatch" }
}

function isbn10To13(v: string): string {
  const core = "978" + v.slice(0, 9)
  let sum = 0
  for (let i = 0; i < 12; i++) sum += Number(core[i]) * (i % 2 === 0 ? 1 : 3)
  return core + ((10 - (sum % 10)) % 10)
}

function isbn13To10(v: string): string {
  if (!v.startsWith("978")) throw new SourceError("only 978-prefixed ISBN-13s have an ISBN-10 equivalent")
  const core = v.slice(3, 12)
  let sum = 0
  for (let i = 0; i < 9; i++) sum += Number(core[i]) * (10 - i)
  const rem = (11 - (sum % 11)) % 11
  return core + (rem === 10 ? "X" : String(rem))
}

export async function validateIsbn(a: { isbn: string }): Promise<string> {
  const r = check(a.isbn)
  return [
    `ISBN: ${r.isbn}`,
    `Format: ${r.kind}`,
    `Valid: ${r.valid ? "yes" : "no"}`,
    `Checksum: ${r.reason}`,
    r.isbn.length === 10 ? `ISBN-13 equivalent: ${isbn10To13(r.isbn)}` : `ISBN-10 equivalent: ${r.isbn.startsWith("978") ? isbn13To10(r.isbn) : "none (979 prefix)"}`,
  ].join("\n")
}

export async function convertIsbn(a: { isbn: string }): Promise<string> {
  const r = check(a.isbn)
  if (!r.valid) throw new SourceError(`${r.isbn} has an invalid checksum`)
  if (r.kind === "ISBN-10") {
    const thirteen = isbn10To13(r.isbn)
    return [`ISBN-10: ${r.isbn}`, `ISBN-13: ${thirteen}`, `ISBN-13 valid: ${checksum13(thirteen) ? "yes" : "no"}`].join("\n")
  }
  if (!r.isbn.startsWith("978")) return `${r.isbn} uses the 979 prefix and has no ISBN-10 form.`
  const ten = isbn13To10(r.isbn)
  return [`ISBN-13: ${r.isbn}`, `ISBN-10: ${ten}`, `ISBN-10 valid: ${checksum10(ten) ? "yes" : "no"}`].join("\n")
}

export async function checkIsbnBatch(a: { isbns: string[] }): Promise<string> {
  const rows: string[] = []
  let bad = 0
  for (const raw of a.isbns) {
    try {
      const r = check(raw)
      if (!r.valid) bad++
      rows.push(`${r.valid ? "ok  " : "bad "} ${r.isbn} (${r.kind}, ${r.reason})`)
    } catch (e) {
      bad++
      rows.push(`bad  ${raw} (${(e as Error).message})`)
    }
  }
  return [`Checked ${a.isbns.length} ISBNs: ${a.isbns.length - bad} valid, ${bad} invalid.`, ...rows].join("\n")
}
