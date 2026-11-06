/**
 * Hex — Erlang and Elixir package metadata from hex.pm. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against hex.pm.
 */
const API = "https://hex.pm/api"

export class HexPmError extends Error {}

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
      headers: { "user-agent": "hex-pm-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new HexPmError(`Hex returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof HexPmError) throw e
    if ((e as Error).name === "AbortError") throw new HexPmError("Hex request timed out")
    throw new HexPmError(`Hex request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function packageInfo(name: string): Promise<string> {
  const pkg = name.trim().toLowerCase()
  if (pkg === "") throw new HexPmError("name must not be empty")
  const body = await get<unknown>(`${API}/packages/${encodeURIComponent(pkg)}`)
  const downloads = at(body, "downloads.all")
  return [
    `${val(at(body, "name"))} ${val(at(body, "latest_version"))}`.trim(),
    "",
    `Downloads: ${typeof downloads === "number" ? downloads.toLocaleString("en-US") : "n/a"}`,
    `Licence: ${val(at(body, "meta.licenses"))}`,
    `Links: ${Object.keys((at(body, "meta.links") as Row | undefined) ?? {}).join(", ") || "none"}`,
    "",
    val(at(body, "meta.description")),
  ].join("\n")
}
