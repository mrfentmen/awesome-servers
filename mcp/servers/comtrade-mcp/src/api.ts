/**
 * UN Comtrade — International trade values between countries, from UN Comtrade. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against comtradeapi.un.org.
 */
const API = "https://comtradeapi.un.org/public/v1/preview"

export class ComtradeError extends Error {}

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
      headers: { "user-agent": "comtrade-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new ComtradeError(`UN Comtrade returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof ComtradeError) throw e
    if ((e as Error).name === "AbortError") throw new ComtradeError("UN Comtrade request timed out")
    throw new ComtradeError(`UN Comtrade request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function trade(reporter = 842, period = 2022): Promise<string> {
  const body = await get<unknown>(`${API}/C/A/HS?reporterCode=${reporter}&period=${period}&partnerCode=0&cmdCode=TOTAL`)
  const items = rows(at(body, "data"))
  if (items.length === 0) return `UN Comtrade has no records for reporter ${reporter} in ${period}.`
  const lines = items.map((r, i) => {
    const flow = val(at(r, "flowDesc")) || val(at(r, "flowCode"))
    const value = at(r, "primaryValue")
    const money = typeof value === "number" ? value.toLocaleString("en-US", { maximumFractionDigits: 0 }) : "n/a"
    return `${i + 1}. ${flow} — ${money} USD`
  })
  return [`Reporter ${reporter}, ${period} — world partner totals`, "", ...lines].join("\n")
}
