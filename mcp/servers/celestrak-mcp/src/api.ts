const BASE = "https://celestrak.org/NORAD/elements/gp.php"
const UA = "mrfentmen-celestrak-mcp/1.0 (https://github.com/mrfentmen)"
export class CelestrakError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new CelestrakError(`CelesTrak returned HTTP ${res.status}`)
  return (await res.json()) as T
}

function fmtSat(s: any, i: number): string {
  const epoch = (s.EPOCH ?? "").replace(" ", "T")
  return `${i + 1}. ${s.OBJECT_NAME ?? "n/a"} | NORAD ${s.NORAD_CAT_ID ?? "n/a"} | ${s.OBJECT_ID ?? "n/a"}\n   Epoch ${epoch || "n/a"} | Inc ${s.INCLINATION ?? "n/a"} | Ecc ${s.ECCENTRICITY ?? "n/a"} | Period ${s.PERIOD ?? "n/a"} min | Mean motion ${s.MEAN_MOTION ?? "n/a"}`
}

export async function group(args: { group?: string; limit?: number }): Promise<string> {
  const g = (args.group ?? "stations").trim()
  const limit = Math.min(args.limit ?? 10, 30)
  const d = await get<any[]>(`${BASE}?GROUP=${encodeURIComponent(g)}&FORMAT=json`)
  const sats = (d ?? []).slice(0, limit)
  if (!sats.length) return `No satellites found in group ${g}. Try stations, visual, active, or weather.`
  return `Group ${g} (showing ${sats.length}):\n` + sats.map(fmtSat).join("\n")
}

export async function satellite(args: { noradId?: number }): Promise<string> {
  const id = Number(args.noradId)
  if (!Number.isInteger(id) || id <= 0) throw new CelestrakError("Provide a positive NORAD catalog number")
  const d = await get<any[]>(`${BASE}?CATNR=${id}&FORMAT=json`)
  const s = (d ?? [])[0]
  if (!s) return `No satellite found for NORAD ${id}`
  return fmtSat(s, 0)
}

// ---- muxA tools:

interface Record {
  OBJECT_NAME?: string
  OBJECT_ID?: string
  NORAD_CAT_ID?: number
  OBJECT_TYPE?: string
  OPS_STATUS_CODE?: string
  OWNER?: string
  LAUNCH_DATE?: string
  LAUNCH_SITE?: string
  DECAY_DATE?: string
  PERIOD?: number
  INCLINATION?: number
  APOGEE?: number
  PERIGEE?: number
  RCS?: string
  ORBIT_CENTER?: string
  ORBIT_TYPE?: number
  DATA_STATUS_CODE?: string
}

function bound(value: number | undefined, fallback: number, max: number): number {
  return Math.max(1, Math.min(Math.round(value ?? fallback), max))
}

export interface CatalogueArgs {
  group?: string
  limit?: number
}

export interface SearchArgs {
  query: string
  group?: string
  limit?: number
}

export async function nameSearch(args: SearchArgs): Promise<string> {
  const q = (args.query ?? '').trim().toLowerCase()
  if (!q) throw new CelestrakError('Provide a name fragment to search for, e.g. "noaa" or "zarya"')
  const g = (args.group ?? 'stations').trim()
  const limit = bound(args.limit, 20, 100)
  const d = await get<any[]>(`${BASE}?GROUP=${encodeURIComponent(g)}&FORMAT=json`)
  const sats = d ?? []
  if (!sats.length) return `CelesTrak returned no satellites for group ${g}.`
  const hits = sats.filter((s) => String(s.OBJECT_NAME ?? '').toLowerCase().includes(q))
  if (!hits.length) {
    const sample = sats.slice(0, 10).map((s) => s.OBJECT_NAME).filter(Boolean).join(', ')
    return `No satellite in group ${g} has "${args.query}" in its name. Sample names there: ${sample}`
  }
  const shown = hits.slice(0, limit)
  return [
    `${hits.length} of ${sats.length} satellite(s) in group ${g} match "${args.query}", showing ${shown.length}.`,
    ...shown.map((s, i) =>
      `${i + 1}. ${s.OBJECT_NAME ?? 'n/a'} | NORAD ${s.NORAD_CAT_ID ?? 'n/a'} | ${s.OBJECT_ID ?? 'n/a'}` +
      ` | inc ${s.INCLINATION ?? 'n/a'} | period ${s.PERIOD ?? 'n/a'} min`,
    ),
    hits.length > shown.length ? `...and ${hits.length - shown.length} more.` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

