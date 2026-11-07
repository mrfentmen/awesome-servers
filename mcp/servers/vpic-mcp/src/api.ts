/**
 * NHTSA vPIC — Decode a vehicle identification number with the official NHTSA database. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against vpic.nhtsa.dot.gov.
 */
const API = "https://vpic.nhtsa.dot.gov/api/vehicles"

export class VpicError extends Error {}

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
      headers: { "user-agent": "vpic-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new VpicError(`NHTSA vPIC returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof VpicError) throw e
    if ((e as Error).name === "AbortError") throw new VpicError("NHTSA vPIC request timed out")
    throw new VpicError(`NHTSA vPIC request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function decodeVin(vin: string): Promise<string> {
  const code = vin.trim().toUpperCase()
  if (code.length < 11) throw new VpicError("VIN must be at least 11 characters")
  const body = await get<unknown>(`${API}/DecodeVinValues/${encodeURIComponent(code)}?format=json`)
  const first = rows(at(body, "Results"))[0]
  if (!first) return `NHTSA could not decode VIN ${code}.`
  const fields = ["Make", "Model", "ModelYear", "VehicleType", "FuelTypePrimary", "EngineCylinders", "PlantCountry"]
  const lines = fields.map((f) => `${f}: ${val(at(first, f)) || "n/a"}`)
  return [`VIN ${code}`, "", ...lines].join("\n")
}
