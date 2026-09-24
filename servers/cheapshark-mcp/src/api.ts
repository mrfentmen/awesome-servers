const BASE = "https://www.cheapshark.com/api/1.0"
const UA = "mrfentmen-cheapshark-mcp/1.0 (https://github.com/mrfentmen)"
export class CheapsharkError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) })
  if (res.status === 429) throw new CheapsharkError("CheapShark rate limit hit, wait and retry")
  if (!res.ok) throw new CheapsharkError(`CheapShark error ${res.status}`)
  return (await res.json()) as T
}

export async function deals(args: { title?: string; limit?: number }): Promise<string> {
  const title = (args.title ?? "").trim()
  const limit = Math.min(args.limit ?? 8, 30)
  const q = title ? `&title=${encodeURIComponent(title)}` : ""
  const d = await get<any[]>(`${BASE}/deals?pageSize=${limit}${q}&upperPrice=60`)
  if (!Array.isArray(d) || !d.length) return "No deals found"
  return d.map((x: any, i: number) => {
    const pct = x?.savings ? Math.round(Number(x.savings)) : 0
    return `${i + 1}. ${x?.title ?? "Untitled"}\n   $${x?.salePrice ?? "?"} (was $${x?.normalPrice ?? "?"}) | ${pct}% off | ${x?.storeID ?? "?"} | ${x?.dealID ?? ""}`
  }).join("\n\n")
}

export async function storeList(args: Record<string, never>): Promise<string> {
  const d = await get<any[]>(`${BASE}/stores`)
  if (!d.length) return "No stores"
  return d.map((s: any) => `${s?.storeID ?? "?"}. ${s?.storeName ?? "n/a"} (${s?.isActive === "1" ? "active" : "inactive"})`).join("\n")
}
