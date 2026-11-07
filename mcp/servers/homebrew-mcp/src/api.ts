/**
 * Homebrew — Homebrew formula details, versions and dependencies. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against formulae.brew.sh.
 */
const API = "https://formulae.brew.sh/api"

export class HomebrewError extends Error {}

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
      headers: { "user-agent": "homebrew-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new HomebrewError(`Homebrew returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof HomebrewError) throw e
    if ((e as Error).name === "AbortError") throw new HomebrewError("Homebrew request timed out")
    throw new HomebrewError(`Homebrew request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function getFormula(name: string): Promise<string> {
  const formula = name.trim().toLowerCase()
  if (formula === "") throw new HomebrewError("formula name must not be empty")
  const body = await get<unknown>(`${API}/formula/${encodeURIComponent(formula)}.json`)
  const deps = rows(at(body, "dependencies")).map((d) => val(d)).filter((d) => d !== "")
  return [
    `${val(at(body, "name"))} ${val(at(body, "versions.stable"))}`,
    "",
    `Description: ${val(at(body, "desc"))}`,
    `Licence: ${val(at(body, "license"))}`,
    `Homepage: ${val(at(body, "homepage"))}`,
    `Dependencies: ${deps.length === 0 ? "none" : deps.join(", ")}`,
    `Deprecated: ${val(at(body, "deprecated")) === "true" ? "yes" : "no"}`,
  ].join("\n")
}
