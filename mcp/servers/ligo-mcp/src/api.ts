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

// ---- gap4c1 tools:

export async function dataSegments(args: { dataset: string; detector: string; start: number; duration?: number; limit?: number }): Promise<string> {
  const start = Math.max(1, Math.min(Math.round(args.start), 3000000000));
  const duration = Math.max(1, Math.min(Math.round(args.duration ?? 32), 86400));
  const limit = Math.max(1, Math.min(Math.round(args.limit ?? 20), 50));
  const dataset = args.dataset.trim();
  if (!/^[A-Za-z0-9_-]{1,60}$/.test(dataset)) throw new LigoError('Provide a GWOSC dataset such as O1.');
  if (!['H1', 'L1', 'V1', 'K1'].includes(args.detector)) throw new LigoError('Use H1, L1, V1 or K1.');
  const res = await fetch(`https://gwosc.org/timeline/segments/json/${encodeURIComponent(dataset)}/${args.detector}_DATA/${start}/${duration}/`, {
    headers: { 'User-Agent': 'mrfentmen-ligo-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new LigoError(`GWOSC timeline returned ${res.status}`);
  const data = await res.json() as { dataset?: string; id?: string; start?: number; end?: number; segments?: number[][] };
  const rows = data.segments ?? [];
  const seconds = rows.reduce((sum, r) => sum + Math.max(0, r[1] - r[0]), 0);
  return [
    `Data availability: ${data.dataset ?? 'not reported'} / ${data.id ?? 'not reported'}`,
    `GPS window ${data.start ?? 'not reported'} to ${data.end ?? 'not reported'} | ${rows.length} segment(s) | ${seconds} seconds available`,
    ...rows.slice(0, limit).map((r, i) => `${i + 1}. GPS ${r[0]} to ${r[1]} (${r[1] - r[0]} seconds)`),
    ...(rows.length > limit ? [`Showing first ${limit} segments.`] : []),
  ].join('\n');
}
