const BASE = "https://epic.gsfc.nasa.gov/api"
const UA = "mrfentmen-nasa-epic-mcp/1.0 (https://github.com/mrfentmen)"
export class EpicError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new EpicError(`NASA EPIC returned HTTP ${res.status}`)
  return (await res.json()) as T
}

function fmt(img: any, i: number): string {
  const date = img?.date ?? ""
  const ymd = date.slice(0, 10).replace(/-/g, "/")
  const imgUrl = img?.image
    ? `https://epic.gsfc.nasa.gov/archive/natural/${ymd}/png/${img.image}.png`
    : "no image"
  return `${i + 1}. ${img?.caption?.slice(0, 110) ?? "no caption"}\n   ${img?.identifier ?? ""} | ${date} | ${imgUrl}`
}

export async function latest(args: { limit?: number }): Promise<string> {
  const limit = Math.min(args.limit ?? 5, 12)
  const d = await get<any[]>(`${BASE}/natural`)
  const list = (d ?? []).slice(0, limit)
  if (!list.length) return "No EPIC images available"
  return `Latest Earth images from EPIC (${list.length} shown):\n` + list.map(fmt).join("\n")
}

export async function date(args: { date?: string }): Promise<string> {
  const date = (args.date ?? "").trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new EpicError("Provide a date like 2026-08-01")
  const d = await get<any[]>(`${BASE}/natural/date/${encodeURIComponent(date)}`)
  const list = (d ?? []).slice(0, 12)
  if (!list.length) return `No EPIC images for ${date}`
  return `Earth images from EPIC on ${date} (${list.length}):\n` + list.map(fmt).join("\n")
}

// ---- muxC tools:

// EPIC publishes two products from the same spacecraft camera. The natural
// product is plain-colour RGB; the enhanced product is reprocessed for ozone
// and aerosol retrieval, so it is a different image with its own identifiers
// and its own archive path.

