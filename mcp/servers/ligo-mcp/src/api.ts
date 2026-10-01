/**
 * Gravitational-Wave Open Science Center event API client, keyless.
 * Docs: https://gwosc.org/api/
 */
const BASE = "https://gwosc.org/eventapi"

export class LigoError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "ligo-mcp/1.0", Accept: "application/json" },
    redirect: "follow",
    signal: AbortSignal.timeout(25000),
  })
  if (res.status === 404) throw new LigoError("Not found.")
  if (!res.ok) throw new LigoError(`GWOSC error ${res.status}`)
  return (await res.json()) as T
}

let catalogCache: string[] | null = null

export async function listCatalogs(): Promise<string[]> {
  if (catalogCache) return catalogCache
  const data = await getJson<Raw>("/")
  catalogCache = Object.keys(data).sort()
  return catalogCache
}

export interface GwEvent {
  name: string
  version?: number
  gps?: number
  catalog?: string
}

export async function listEvents(catalog = "GWTC", limit = 10): Promise<GwEvent[]> {
  const clean = catalog.trim() || "GWTC"
  const known = await listCatalogs().catch(() => [] as string[])
  if (known.length > 0 && !known.includes(clean)) {
    throw new LigoError(`Unknown catalog "${catalog}". Use list_catalogs for valid names.`)
  }
  const data = await getJson<Raw>(`/json/${encodeURIComponent(clean)}/`)
  const events: Raw = data.events ?? {}
  const names = Object.keys(events).slice(0, limit)
  return names.map((n) => {
    const e: Raw = events[n] ?? {}
    return {
      name: String(e.commonName ?? n),
      version: e.version,
      gps: e.GPS,
      catalog: e["catalog.shortName"] ?? clean,
    }
  })
}

export async function getEvent(name: string): Promise<string> {
  const clean = name.trim().toUpperCase()
  if (!/^GW\d+(_\d+)?$/.test(clean)) {
    throw new LigoError(`Not an event name: "${name}". Try "GW150914" (use list_events).`)
  }
  const lines: string[] = [`${clean}`]
  for (const cat of ["GWTC", "GWTC-1-confident", "GWTC-3-confident", "GWTC-4.0", "GWTC-5.0"]) {
    try {
      const data = await getJson<Raw>(`/json/${cat}/`)
      const events: Raw = data.events ?? {}
      const key = Object.keys(events).find((k) => k.toUpperCase().startsWith(clean))
      if (key) {
        const e: Raw = events[key]
        lines.push(
          `Catalog: ${e["catalog.shortName"] ?? cat}`,
          `GPS: ${e.GPS ?? "?"}`,
          `Version: ${e.version ?? "?"}`,
          e.jsonurl ? `Data: ${e.jsonurl}` : ""
        )
        return lines.filter(Boolean).join("\n")
      }
    } catch {
      continue
    }
  }
  return `${clean}: not found in GWTC catalogs.`
}

export function formatEvent(e: GwEvent, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  return `${prefix}${e.name}${e.catalog ? ` [${e.catalog}]` : ""}${e.gps ? ` (GPS ${e.gps})` : ""}`
}

// ---- muxB tools:

function param(value: unknown, unit: unknown): string {
  if (value == null) return "not reported"
  const n = Number(value)
  if (!Number.isFinite(n)) return "not reported"
  const u = typeof unit === "string" && unit.trim() !== "" ? ` ${unit}` : ""
  return `${n}${u}`
}

function band(value: unknown, lower: unknown, upper: unknown, unit: unknown): string {
  const mid = value == null ? "not reported" : param(value, unit)
  const lo = lower == null ? null : Number(lower)
  const hi = upper == null ? null : Number(upper)
  if (lo == null || hi == null || !Number.isFinite(lo) || !Number.isFinite(hi)) return mid
  return `${mid} (-${Math.abs(lo)} / +${Math.abs(hi)})`
}

export async function eventParameters(name: string): Promise<string> {
  const clean = name.trim().toUpperCase()
  if (!/^GW\d+(_\d+)?$/.test(clean)) {
    throw new LigoError(`Not an event name: "${name}". Try "GW150914" (use list_events).`)
  }
  for (const cat of ["GWTC", "GWTC-1-confident", "GWTC-3-confident", "GWTC-4.0", "GWTC-5.0"]) {
    let data: Raw
    try {
      data = await getJson<Raw>(`/json/${encodeURIComponent(cat)}/`)
    } catch {
      continue
    }
    const events: Raw = data.events ?? {}
    const key = Object.keys(events).find((k) => k.toUpperCase().startsWith(clean))
    if (!key) continue
    const e: Raw = events[key]
    return [
      `Source properties of ${String(e.commonName ?? key)} in ${e["catalog.shortName"] ?? cat}`,
      `Component masses: ${band(e.mass_1_source, e.mass_1_source_lower, e.mass_1_source_upper, e.mass_1_source_unit)} | ${band(e.mass_2_source, e.mass_2_source_lower, e.mass_2_source_upper, e.mass_2_source_unit)}`,
      `Total source mass: ${band(e.total_mass_source, e.total_mass_source_lower, e.total_mass_source_upper, e.total_mass_source_unit)}`,
      `Chirp mass: ${band(e.chirp_mass, e.chirp_mass_lower, e.chirp_mass_upper, e.chirp_mass_unit)}`,
      `Final source mass: ${band(e.final_mass_source, e.final_mass_source_lower, e.final_mass_source_upper, e.final_mass_source_unit)}`,
      `Effective spin: ${band(e.chi_eff, e.chi_eff_lower, e.chi_eff_upper, e.chi_eff_unit)}`,
      `Luminosity distance: ${band(e.luminosity_distance, e.luminosity_distance_lower, e.luminosity_distance_upper, e.luminosity_distance_unit)}`,
      `Redshift: ${band(e.redshift, e.redshift_lower, e.redshift_upper, e.redshift_unit)}`,
      `Probability of astrophysical origin: ${band(e.p_astro, e.p_astro_lower, e.p_astro_upper, e.p_astro_unit)}`,
      `False alarm rate: ${param(e.far, e.far_unit)}`,
      `Network matched filter SNR: ${param(e.network_matched_filter_snr, e.network_matched_filter_snr_unit)}`,
      e.reference ? `Reference: ${e.reference}` : "",
    ].filter((l) => l !== "").join("\n")
  }
  return `${clean}: not found in GWTC catalogs.`
}
