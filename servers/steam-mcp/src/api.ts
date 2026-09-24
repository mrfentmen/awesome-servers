/**
 * Steam client — keyless store endpoints.
 *  - Store search:   /api/storesearch
 *  - App details:    /api/appdetails   (filtered to keep payloads small)
 *  - News:           ISteamNews/GetNewsForApp (Steamworks Web API, no key
 *                    required for this endpoint)
 */

const STORE = "https://store.steampowered.com/api"
const NEWS = "https://api.steampowered.com/ISteamNews/GetNewsForApp/v2"

export class SteamError extends Error {}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "steam-mcp/1.0" },
  })
  if (!res.ok) throw new SteamError(`Steam API error ${res.status}: ${res.statusText}`)
  return (await res.json()) as T
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StoreItem {
  type: string
  appid: number
  name: string
  price?: {
    currency: string
    initial: number
    final: number
    discount_percent: number
  }
  tinyImage?: string
}

export interface AppDetail {
  appid: number
  name: string
  type?: string
  isFree?: boolean
  price: {
    currency: string
    initial: number
    final: number
    discountPercent: number
  } | null
  releaseDate?: string
  developers: string[]
  genres: string[]
  metacritic?: number
  description?: string
  headerImage?: string
  url: string
}

export interface NewsItem {
  title: string
  url: string
  author?: string
  date?: string
  contents?: string
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export async function searchStore(query: string): Promise<StoreItem[]> {
  const data = await getJson<{ items?: any[] }>(
    `${STORE}/storesearch/?term=${encodeURIComponent(query)}&cc=US&l=en`
  )
  return (data.items ?? [])
    .filter((i) => i.type === "app")
    .slice(0, 12)
    .map((i) => ({ ...i, appid: i.id }))
}

export async function getAppDetail(appid: number): Promise<AppDetail | null> {
  const filters = [
    "basic",
    "price_overview",
    "release_date",
    "developers",
    "genres",
    "metacritic",
    "short_description",
    "header_image",
  ].join(",")
  const data = await getJson<Record<string, { success: boolean; data?: any }>>(
    `${STORE}/appdetails?appids=${appid}&cc=US&l=en&filters=${filters}`
  )
  const entry = data[String(appid)]
  if (!entry?.success || !entry.data) return null
  const d = entry.data
  const price = d.price_overview
  return {
    appid,
    name: d.name ?? "?",
    type: d.type,
    isFree: d.is_free,
    price: price
      ? {
          currency: price.currency ?? "USD",
          initial: price.initial ?? 0,
          final: price.final ?? 0,
          discountPercent: price.discount_percent ?? 0,
        }
      : null,
    releaseDate: d.release_date?.date,
    developers: d.developers ?? [],
    genres: (d.genres ?? []).map((g: any) => g.description),
    metacritic: d.metacritic?.score,
    description: d.short_description,
    headerImage: d.header_image,
    url: `https://store.steampowered.com/app/${appid}`,
  }
}

export async function getNews(appid: number, count: number): Promise<NewsItem[]> {
  const data = await getJson<{ appnews?: { newsitems?: any[] } }>(
    `${NEWS}/?appid=${appid}&count=${count}&maxlength=600`
  )
  return (data.appnews?.newsitems ?? []).map((n) => ({
    title: n.title ?? "?",
    url: n.url ?? "",
    author: n.author,
    date: n.date ? new Date(n.date * 1000).toISOString().slice(0, 10) : undefined,
    contents: n.contents ? stripHtml(n.contents).slice(0, 300) : undefined,
  }))
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function fmtPrice(cents: number, currency = "USD"): string {
  const symbol = currency === "USD" ? "$" : `${currency} `
  return `${symbol}${(cents / 100).toFixed(2)}`
}

export function formatStoreItem(i: StoreItem): string {
  const price = i.price
    ? i.price.discount_percent > 0
      ? `~~${fmtPrice(i.price.initial, i.price.currency)}~~ → **${fmtPrice(
          i.price.final,
          i.price.currency
        )}** (-${i.price.discount_percent}%)`
      : fmtPrice(i.price.final, i.price.currency)
    : "no price data"
  return `[${i.appid}] ${i.name}\n   ${price}\n   https://store.steampowered.com/app/${i.appid}`
}

export function formatAppDetail(a: AppDetail): string {
  const lines = [
    `[${a.appid}] ${a.name}${a.type ? ` (${a.type})` : ""}`,
    a.price
      ? a.price.discountPercent > 0
        ? `Price: ~~${fmtPrice(a.price.initial)}~~ → ${fmtPrice(a.price.final)} (-${a.price.discountPercent}%)`
        : `Price: ${fmtPrice(a.price.final)}`
      : a.isFree
        ? "Free to play"
        : "Price unavailable",
    a.releaseDate ? `Released: ${a.releaseDate}` : "",
    a.developers.length ? `Developers: ${a.developers.join(", ")}` : "",
    a.genres.length ? `Genres: ${a.genres.join(", ")}` : "",
    a.metacritic ? `Metacritic: ${a.metacritic}` : "",
  ].filter(Boolean)
  if (a.description) lines.push(`\n${a.description}`)
  lines.push(`\n${a.url}`)
  return lines.join("\n")
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/\[\[([^\]]*)\]\]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}
