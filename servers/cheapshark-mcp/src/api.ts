const BASE = "https://www.cheapshark.com/api/1.0"
const UA = "mrfentmen-cheapshark-mcp/1.0 (https://github.com/mrfentmen)"
export class CheapsharkError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) })
  if (res.status === 429) throw new CheapsharkError("CheapShark rate limit hit, wait and retry")
  if (!res.ok) throw new CheapsharkError(`CheapShark error ${res.status}`)
  return (await res.json()) as T
}

// storeID -> storeName, so prices can be labelled with a real shop name.
let storeCache: Map<string, string> | null = null

async function storeNames(): Promise<Map<string, string>> {
  if (!storeCache) {
    const stores = await get<any[]>(`${BASE}/stores`)
    storeCache = new Map(stores.map((s: any) => [String(s?.storeID ?? ""), String(s?.storeName ?? "?")]))
  }
  return storeCache
}

const money = (v: unknown) => {
  const n = Number(v)
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : "?"
}

export async function deals(args: { title?: string; limit?: number; maxPrice?: number; storeID?: string }): Promise<string> {
  const title = (args.title ?? "").trim()
  const limit = Math.min(args.limit ?? 8, 30)
  const maxPrice = Number.isFinite(args.maxPrice) ? (args.maxPrice as number) : 60
  const store = (args.storeID ?? "").trim()
  const q = title ? `&title=${encodeURIComponent(title)}` : ""
  const s = store ? `&storeID=${encodeURIComponent(store)}` : ""
  const d = await get<any[]>(`${BASE}/deals?pageSize=${limit}${q}${s}&upperPrice=${maxPrice}`)
  if (!Array.isArray(d) || !d.length) return "No deals found"
  const names = await storeNames()
  return d.map((x: any, i: number) => {
    const pct = x?.savings ? Math.round(Number(x.savings)) : 0
    const shop = names.get(String(x?.storeID ?? "")) ?? `store ${x?.storeID ?? "?"}`
    const meta = x?.metacriticScore && x.metacriticScore !== "0" ? ` | metacritic ${x.metacriticScore}` : ""
    return `${i + 1}. ${x?.title ?? "Untitled"}\n   ${money(x?.salePrice)} (was ${money(x?.normalPrice)}) | ${pct}% off | ${shop}${meta}\n   dealID ${x?.dealID ?? ""}${x?.gameID ? ` | gameID ${x.gameID}` : ""}`
  }).join("\n\n")
}

export async function storeList(_args: Record<string, never>): Promise<string> {
  const d = await get<any[]>(`${BASE}/stores`)
  if (!d.length) return "No stores"
  return d.map((s: any) => `${s?.storeID ?? "?"}. ${s?.storeName ?? "n/a"} (${s?.isActive === "1" ? "active" : "inactive"})`).join("\n")
}

export async function searchGames(args: { title: string; limit?: number }): Promise<string> {
  const title = (args.title ?? "").trim()
  if (!title) return "Provide a game title."
  const limit = Math.min(args.limit ?? 8, 20)
  const d = await get<any[]>(`${BASE}/games?title=${encodeURIComponent(title)}&limit=${limit}`)
  if (!Array.isArray(d) || !d.length) return `No games matching "${title}".`
  return `Games matching "${title}":\n` + d.map((g: any, i: number) =>
    `${i + 1}. ${g?.external ?? "?"} — cheapest ${money(g?.cheapest)} | gameID ${g?.gameID ?? "?"}`
  ).join("\n")
}

export async function gameDetails(args: { gameID: string }): Promise<string> {
  const id = String(args.gameID ?? "").trim()
  if (!id) return "Provide a gameID (see search_games)."
  const d = await get<any>(`${BASE}/games?id=${encodeURIComponent(id)}`)
  const info = d?.info ?? {}
  const dealsList = Array.isArray(d?.deals) ? d.deals : []
  if (!info?.title && !dealsList.length) return `No game with gameID ${id}.`
  const names = await storeNames()
  const lines = [`${info?.title ?? `game ${id}`} (gameID ${id})`]
  if (d?.cheapestPriceEver?.price) {
    lines.push(`Cheapest ever: ${money(d.cheapestPriceEver.price)} on ${new Date(Number(d.cheapestPriceEver.date) * 1000).toISOString().slice(0, 10)}`)
  }
  const rows = dealsList
    .map((x: any) => ({ shop: names.get(String(x?.storeID ?? "")) ?? `store ${x?.storeID}`, price: Number(x?.price ?? NaN), retail: Number(x?.retailPrice ?? NaN) }))
    .filter((r: { price: number }) => Number.isFinite(r.price))
    .sort((a: { price: number }, b: { price: number }) => a.price - b.price)
  if (!rows.length) lines.push("No store currently lists this game.")
  for (const r of rows) lines.push(`  ${money(r.price)}${Number.isFinite(r.retail) ? ` (retail ${money(r.retail)})` : ""} — ${r.shop}`)
  return lines.join("\n")
}

export async function topDeals(args: { limit?: number; storeID?: string }): Promise<string> {
  const limit = Math.min(args.limit ?? 8, 25)
  const store = (args.storeID ?? "").trim()
  const s = store ? `&storeID=${encodeURIComponent(store)}` : ""
  const d = await get<any[]>(`${BASE}/deals?sortBy=Deal%20Rating&pageSize=${limit}${s}`)
  if (!Array.isArray(d) || !d.length) return "No deals found"
  const names = await storeNames()
  return "Best deals right now (by deal rating):\n" + d.map((x: any, i: number) => {
    const pct = x?.savings ? Math.round(Number(x.savings)) : 0
    return `${i + 1}. ${x?.title ?? "?"} — ${money(x?.salePrice)} (was ${money(x?.normalPrice)}), ${pct}% off at ${names.get(String(x?.storeID ?? "")) ?? "?"}`
  }).join("\n")
}

export async function freeGames(args: { limit?: number }): Promise<string> {
  const limit = Math.min(args.limit ?? 10, 30)
  const d = await get<any[]>(`${BASE}/deals?upperPrice=0&pageSize=${limit}`)
  if (!Array.isArray(d) || !d.length) return "No free games right now."
  const names = await storeNames()
  return "Free games right now:\n" + d.map((x: any, i: number) =>
    `${i + 1}. ${x?.title ?? "?"} — free at ${names.get(String(x?.storeID ?? "")) ?? "?"} (was ${money(x?.normalPrice)})`
  ).join("\n")
}
