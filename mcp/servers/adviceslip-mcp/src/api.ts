/**
 * Advice Slip — A random piece of advice from Advice Slip. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against api.adviceslip.com.
 */
const API = "https://api.adviceslip.com"

export class AdviceSlipError extends Error {}

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
      headers: { "user-agent": "adviceslip-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new AdviceSlipError(`Advice Slip returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof AdviceSlipError) throw e
    if ((e as Error).name === "AbortError") throw new AdviceSlipError("Advice Slip request timed out")
    throw new AdviceSlipError(`Advice Slip request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function randomAdvice(): Promise<string> {
  const body = await get<unknown>(`${API}/advice`)
  const advice = val(at(body, "slip.advice"))
  if (advice === "") throw new AdviceSlipError("Advice Slip returned no advice")
  return [`"${advice}"`, "", `Slip ${val(at(body, "slip.id"))}`].join("\n")
}
