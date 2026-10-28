/**
 * Morse Code — keyless public API client.
 */
const BASE = "https://example.invalid"
const SOURCE = "Morse Code"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "morse-mcp", accept },
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

const TABLE: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....",
  I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.",
  Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
  Y: "-.--", Z: "--..", "0": "-----", "1": ".----", "2": "..---", "3": "...--",
  "4": "....-", "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
  ".": ".-.-.-", ",": "--..--", "?": "..--..", "'": ".----.", "!": "-.-.--", "/": "-..-.",
  "(": "-.--.", ")": "-.--.-", "&": ".-...", ":": "---...", ";": "-.-.-.", "=": "-...-",
  "+": ".-.-.", "-": "-....-", "_": "..--.-", '"': ".-..-.", "$": "...-..-", "@": ".--.-.",
}
const REVERSE: Record<string, string> = Object.fromEntries(Object.entries(TABLE).map(([k, v]) => [v, k]))

export async function encodeMorse(a: { text: string }): Promise<string> {
  const words = a.text.toUpperCase().split(/\s+/).filter(Boolean)
  const encoded = words.map((w) => w.split("").map((ch) => {
    const code = TABLE[ch]
    if (!code) throw new SourceError(`no Morse pattern for "${ch}"`)
    return code
  }).join(" "))
  return encoded.join(" / ")
}

export async function decodeMorse(a: { morse: string }): Promise<string> {
  const words = a.morse.trim().split(/\s*\/\s*/)
  const out = words.map((w) => w.trim().split(/\s+/).filter(Boolean).map((code) => {
    const ch = REVERSE[code]
    if (!ch) throw new SourceError(`"${code}" is not a Morse pattern`)
    return ch
  }).join(""))
  return out.join(" ")
}

export async function morseReference(a: { character?: string }): Promise<string> {
  if (!a.character) {
    const entries = Object.entries(TABLE)
    return ["International Morse Code:", ...entries.map(([ch, code]) => `${ch}  ${code}`)].join("\n")
  }
  const ch = a.character.toUpperCase()
  const code = TABLE[ch]
  if (!code) throw new SourceError(`no Morse pattern for "${a.character}"`)
  return `${ch} = ${code}`
}
