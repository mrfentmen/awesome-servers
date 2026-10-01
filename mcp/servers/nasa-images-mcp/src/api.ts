const BASE = "https://images-api.nasa.gov"
const UA = "mrfentmen-nasa-images-mcp/1.0 (https://github.com/mrfentmen)"
export class NasaImagesError extends Error {}

export async function search(args: { query?: string; limit?: number }): Promise<string> {
  const q = (args.query ?? "").trim()
  if (!q) throw new NasaImagesError("Provide a search query")
  const limit = Math.min(args.limit ?? 8, 20)
  const res = await fetch(`${BASE}/search?q=${encodeURIComponent(q)}&media_type=image,video&page_size=${limit}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new NasaImagesError(`NASA Images returned HTTP ${res.status}`)
  const d = (await res.json()) as any
  const items = d?.collection?.items ?? []
  const total = d?.collection?.metadata?.total_hits ?? items.length
  if (!items.length) return `No NASA media found for \"${q}\"`
  const rows = items.map((it: any, i: number) => {
    const data = it?.data?.[0] ?? {}
    const link = it?.links?.find((l: any) => l?.rel === "preview")?.href ?? ""
    const title = data?.title ?? "untitled"
    return `${i + 1}. ${title}\n   ${data?.media_type ?? ""} | ${data?.date_created?.slice(0, 10) ?? ""} | ${link || "no preview"}`
  })
  return `NASA media for \"${q}\" (${total} total, ${rows.length} shown):\n` + rows.join("\n")
}

// ---- muxC tools:

async function nasaImagesJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new NasaImagesError(`NASA Images returned HTTP ${res.status}`)
  return (await res.json()) as T
}

