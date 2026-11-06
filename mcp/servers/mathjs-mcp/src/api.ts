/**
 * math.js — Evaluate a maths expression on the math.js API. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against api.mathjs.org.
 */
const API = "https://api.mathjs.org/v4"

export class MathJsError extends Error {}

type Row = Record<string, unknown>

const val = (v: unknown): string => {
  if (typeof v === "string") return v
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : ""
  if (Array.isArray(v)) return v.length > 0 ? val(v[0]) : ""
  if (v && typeof v === "object") {
    const o = v as Row
    if ("en" in o) return val(o.en)
    const first = Object.values(o)[0]
    return first === undefined ? "" : val(first)
  }
  return ""
}

const at = (o: unknown, path: string): unknown =>
  path === "" ? o : path.split(".").reduce<unknown>((acc, k) => (acc && typeof acc === "object" ? (acc as Row)[k] : undefined), o)

const rows = (v: unknown): Row[] => (Array.isArray(v) ? (v as Row[]) : [])

async function get<T>(url: string, init?: RequestInit, timeoutMs = 25000): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: { "user-agent": "mathjs-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new MathJsError(`math.js returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof MathJsError) throw e
    if ((e as Error).name === "AbortError") throw new MathJsError("math.js request timed out")
    throw new MathJsError(`math.js request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

async function getText(url: string, timeoutMs = 30000): Promise<string> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "user-agent": "mathjs-mcp", accept: "*/*" } })
    if (!res.ok) throw new MathJsError(`math.js returned HTTP ${res.status}`)
    return await res.text()
  } catch (e) {
    if (e instanceof MathJsError) throw e
    if ((e as Error).name === "AbortError") throw new MathJsError("math.js request timed out")
    throw new MathJsError(`math.js request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function evaluate(expression: string): Promise<string> {
  const expr = expression.trim()
  if (expr === "") throw new MathJsError("expression must not be empty")
  const text = await getText(`${API}/?expr=${encodeURIComponent(expr)}`)
  const answer = text.trim()
  if (answer === "") throw new MathJsError("math.js returned an empty result")
  if (answer.toLowerCase().startsWith("error")) throw new MathJsError(answer)
  return `${expr} = ${answer}`
}
