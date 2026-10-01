export class EcccError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "EcccError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }
const BASE = "https://api.weather.gc.ca"

async function authHeaders(): Promise<Record<string, string>> {
  return {}
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(url: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(url, { headers: { ...UA, ...(await authHeaders()), ...(init.headers ?? {}) }, ...init })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new EcccError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function listCollections(): Promise<string> {
  let url = BASE + `/collections`;
  const data = await req(url);
  return pretty(data);
}

export async function getCollection(collectionId: string): Promise<string> {
  let url = BASE + `/collections/${encodeURIComponent(String(collectionId))}`;
  const data = await req(url);
  return pretty(data);
}

export async function queryCollection(collectionId: string, bbox?: string, limit?: number): Promise<string> {
  let url = BASE + `/collections/${encodeURIComponent(String(collectionId))}/items`;
  const qs = new URLSearchParams();
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

// ---- muxF tools:
interface EcccCollection {
  id?: string
  title?: string
  description?: string
  itemType?: string | null
  keywords?: string[]
  crs?: string[]
  extent?: {
    spatial?: { bbox?: number[][] }
    temporal?: { interval?: string[][] }
  } | null
  links?: Array<{ rel?: string; type?: string; title?: string; href?: string }>
}

interface EcccItem {
  id?: string
  geometry?: { type?: string; coordinates?: number[] } | null
  properties?: Record<string, unknown> | null
}

interface EcccItems {
  type?: string
  numberMatched?: number
  numberReturned?: number
  timeStamp?: string
  features?: EcccItem[]
}

async function geomItems(collectionId: string, params: URLSearchParams): Promise<EcccItems> {
  const url = `${BASE}/collections/${encodeURIComponent(String(collectionId))}/items?${params.toString()}`
  const data = await req(url)
  return data as EcccItems
}

function said(value: unknown, chars = 160): string {
  const text = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : ""
  if (!text) return "not reported"
  return text.length > chars ? `${text.slice(0, chars)}...` : text
}

function asText(value: unknown): string {
  if (value == null) return ""
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (typeof value === "object") {
    const en = (value as { en?: unknown }).en
    if (typeof en === "string" && en) return en
  }
  return ""
}

function pointOf(item: EcccItem): [number, number] | null {
  const coords = item.geometry?.coordinates
  if (item.geometry?.type !== "Point" || !Array.isArray(coords) || coords.length < 2) return null
  const lon = Number(coords[0])
  const lat = Number(coords[1])
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null
  return [lon, lat]
}

function bboxParam(bbox: string | undefined, extra: Record<string, string>): string {
  const params = new URLSearchParams(extra)
  const clean = (bbox ?? "").trim()
  if (clean) {
    const parts = clean.split(",").map((p) => Number(p.trim()))
    if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) {
      throw new EcccError("Bounding box must be four numbers: minlon,minlat,maxlon,maxlat")
    }
    params.set("bbox", parts.join(","))
  }
  return params.toString()
}

/** Tally what a point-based collection holds inside a box, instead of listing every row. */
export async function inventorySummary(args: { collectionId?: string; bbox?: string; limit?: number }): Promise<string> {
  const collectionId = (args.collectionId ?? "").trim()
  if (!collectionId) return "Provide a collection id, for example hydrometric-stations."
  const limit = Math.max(1, Math.min(args.limit ?? 100, 500))
  const page = await geomItems(collectionId, new URLSearchParams(bboxParam(args.bbox, { f: "json", limit: String(limit) })))
  const features = page.features ?? []
  if (!features.length) {
    return `Collection ${collectionId} returned no items${args.bbox ? " inside that bounding box" : ""}.${page.numberMatched === 0 ? " The service reports 0 matches." : ""}`
  }
  const provinces = new Map<string, number>()
  const statuses = new Map<string, number>()
  const withGeometry = features.filter((f) => pointOf(f) !== null).length
  for (const f of features) {
    const p = f.properties ?? {}
    const prov = asText(p.PROV_TERR_STATE_LOC) || asText(p.PROV_TERR_STATE_LOC_EN) || "not reported"
    provinces.set(prov, (provinces.get(prov) ?? 0) + 1)
    const status = asText(p.STATUS_EN) || asText(p.STATUS) || "not reported"
    statuses.set(status, (statuses.get(status) ?? 0) + 1)
  }
  const tally = (m: Map<string, number>, cap: number) =>
    [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, cap)
  const matched = page.numberMatched ?? features.length
  return [
    `Inventory of ${collectionId}${args.bbox ? ` inside ${args.bbox}` : ""}`,
    `Service reports ${matched} item(s) match; ${features.length} inspected here${matched > features.length ? " (page limit reached)" : ""}.`,
    `Items carrying point geometry: ${withGeometry} of ${features.length}`,
    `Province or territory: ${tally(provinces, 12).map(([k, n]) => `${k} ${n}`).join(", ")}`,
    `Status: ${tally(statuses, 8).map(([k, n]) => `${k} ${n}`).join(", ")}`,
    `Snapshot taken: ${said(page.timeStamp, 40)}`,
    "Counts are over the inspected page only, so they describe the box, not the whole collection.",
  ].join("\n")
}

// ---- gap3b tools:

export interface ItemArgs {
  collectionId?: string;
  itemId?: string;
}

