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
// ---- batch-3 tools: Steam AppID lookup + filtered deals (2026-09-27) ----
export async function steamLookup(args: { appID?: string; limit?: number }): Promise<string> {
  const id = String(args.appID ?? "").trim()
  if (!/^\d{2,10}$/.test(id)) throw new CheapsharkError("Provide a numeric Steam AppID, e.g. 1245620 for ELDEN RING")
  const limit = Math.min(args.limit ?? 5, 20)
  const d = await get<any[]>(`${BASE}/games?steamAppID=${encodeURIComponent(id)}`)
  if (!Array.isArray(d) || !d.length) {
    return `CheapShark has no Steam-linked entry for AppID ${id}. Not every game is linked to its Steam AppID — try search_games with the title instead.`
  }
  return `Steam AppID ${id} — ${d.length} CheapShark game(s):\n` + d.slice(0, limit).map((g: any, i: number) =>
    `${i + 1}. ${g?.external ?? "?"} — cheapest ${money(g?.cheapest)} | gameID ${g?.gameID ?? "?"}`
  ).join("\n")
}

const DEAL_SORTS = ["Deal Rating", "Price", "Savings", "Metacritic", "Reviews", "Release", "Recent"]

export async function filterDeals(args: {
  minPrice?: number
  maxPrice?: number
  metacritic?: number
  steamRating?: number
  onSale?: boolean
  aaa?: boolean
  sort?: string
  limit?: number
}): Promise<string> {
  const limit = Math.min(args.limit ?? 10, 25)
  const params = new URLSearchParams()
  if (typeof args.minPrice === "number" && Number.isFinite(args.minPrice)) params.set("lowerPrice", String(args.minPrice))
  if (typeof args.maxPrice === "number" && Number.isFinite(args.maxPrice)) params.set("upperPrice", String(args.maxPrice))
  if (typeof args.metacritic === "number" && Number.isFinite(args.metacritic)) params.set("metacritic", String(args.metacritic))
  if (typeof args.steamRating === "number" && Number.isFinite(args.steamRating)) params.set("steamRating", String(args.steamRating))
  if (args.onSale === true) params.set("onSale", "1")
  if (args.aaa === true) params.set("AAA", "1")
  const sort = (args.sort ?? "").trim()
  if (sort) {
    const match = DEAL_SORTS.find((s) => s.toLowerCase() === sort.toLowerCase())
    if (!match) throw new CheapsharkError(`sort must be one of ${DEAL_SORTS.join(", ")}`)
    params.set("sortBy", match)
    params.set("desc", "0")
  }
  params.set("pageSize", String(limit))
  const d = await get<any[]>(`${BASE}/deals?${params.toString()}`)
  if (!Array.isArray(d) || !d.length) return "No deals matched those filters."
  const names = await storeNames()
  return `Filtered deals (${d.length} shown):\n` + d.map((x: any, i: number) => {
    const pct = x?.savings ? Math.round(Number(x.savings)) : 0
    const meta = x?.metacriticScore && x.metacriticScore !== "0" ? ` | metacritic ${x.metacriticScore}` : ""
    const rating = x?.steamRatingText ? ` | Steam ${x.steamRatingText}` : ""
    return `${i + 1}. ${x?.title ?? "?"} — ${money(x?.salePrice)} (was ${money(x?.normalPrice)}), ${pct}% off at ${names.get(String(x?.storeID ?? "")) ?? "?"}${meta}${rating}`
  }).join("\n")
}

// ---- muxD tools:

interface Deal {
  internalName?: string
  title?: string
  dealID?: string
  storeID?: string
  gameID?: string
  salePrice?: string
  normalPrice?: string
  isOnSale?: string
  savings?: string
  metacriticScore?: string
  steamRatingText?: string
  steamRatingPercent?: string
  steamRatingCount?: string
  steamAppID?: string
  releaseDate?: number
  lastChange?: number
  dealRating?: string
}

/** CheapShark caps pageSize at 60 and its page parameter no longer changes the result, so every read here is one page. */
async function dealPage(): Promise<Deal[]> {
  const d = await get<Deal[]>(`${BASE}/deals?pageSize=60`)
  return Array.isArray(d) ? d : []
}

const num = (v: unknown): number => {
  const n = Number(v)
  return Number.isFinite(n) ? n : NaN
};

function medianOf(values: number[]): number {
  const a = [...values].sort((x, y) => x - y);
  return a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
}

/** Bucket labels and the value each deal falls into. */
function bucketise(values: Array<{ value: number }>, edges: number[]): { label: string; n: number }[] {
  const out = edges.map((e, i) => ({
    label: i === edges.length - 1 ? `${e}+` : `${edges[i]}-${edges[i + 1] - 1}`,
    n: 0,
  }));
  for (const v of values) {
    let idx = out.length - 1;
    for (let i = 0; i < edges.length - 1; i += 1) {
      if (v.value < edges[i + 1]) { idx = i; break }
    }
    out[idx].n += 1;
  }
  return out;
}

export interface ScanArgs {
  page_size?: number;
}

export interface LeaderboardArgs {
  page_size?: number;
  top?: number;
}

export interface PicksArgs {
  top?: number;
}

/** The cheapest and the best-value titles on the page, by absolute price and by discount. */
export async function valuePicks(args: PicksArgs): Promise<string> {
  const top = Math.max(1, Math.min(Math.floor(Number(args.top ?? 8) || 8), 25));
  const rows = await dealPage();
  if (!rows.length) return "CheapShark returned no deals to pick from."
  const names = await storeNames();
  const priced = rows.map((d) => ({ d, price: num(d.salePrice), normal: num(d.normalPrice), save: num(d.savings) }))
    .filter((x) => Number.isFinite(x.price));
  if (!priced.length) throw new CheapsharkError("No deal in this page carried a usable price.")
  const free = priced.filter((x) => x.price === 0);
  const paid = priced.filter((x) => x.price > 0);
  const perDollar = priced
    .filter((x) => Number.isFinite(x.save) && x.save > 0 && x.price > 0)
    .map((x) => ({ ...x, ratio: x.save / x.price }))
    .sort((a, b) => b.ratio - a.ratio);
  const label = (x: { d: Deal }) => names.get(String(x.d.storeID ?? "")) ?? "?";

  const lines = [
    `Value picks from ${rows.length} deal(s) in the current CheapShark page`,
    "",
    `Cheapest paid titles (${Math.min(top, paid.length)} of ${paid.length}):`,
  ];
  if (!paid.length) lines.push("  (every deal on this page is free)");
  for (const x of paid.slice(0, top)) {
    lines.push(`  ${money(x.price)} — ${x.d.title ?? "?"}${Number.isFinite(x.save) ? ` (${x.save.toFixed(0)}% off, was ${money(x.normal)})` : ""} | ${label(x)}`);
  }
  lines.push("", `Most discount per dollar spent (${Math.min(top, perDollar.length)} of ${perDollar.length}):`);
  if (!perDollar.length) lines.push("  (no deal reports a discount with a paid price)");
  for (const x of perDollar.slice(0, top)) {
    lines.push(`  ${x.ratio.toFixed(2)}x — ${money(x.price)} giving ${x.save.toFixed(0)}% off, was ${money(x.normal)} | ${x.d.title ?? "?"} | ${label(x)}`);
  }
  lines.push("", `Free titles with a real retail price (${free.length}):`);
  if (!free.length) lines.push("  (none on this page)");
  for (const x of free.slice(0, top)) {
    lines.push(`  ${money(x.price)} vs ${money(x.normal)} retail — ${x.d.title ?? "?"} | ${label(x)}`);
  }
  return lines.join("\n");
}
