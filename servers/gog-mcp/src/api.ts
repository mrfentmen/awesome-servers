const CATALOG = "https://catalog.gog.com/v1/catalog"
const PRODUCTS = "https://api.gog.com/products"
const UA = "mrfentmen-gog-mcp/1.0 (https://github.com/mrfentmen)"
const LOCALE = "countryCode=US&locale=en-US&currencyCode=USD"

export class GogError extends Error {}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(25000),
  })
  if (res.status === 404) throw new GogError(`Not found (404): ${url}`)
  if (!res.ok) throw new GogError(`GOG returned ${res.status}`)
  return (await res.json()) as T
}

interface CatalogProduct {
  id?: string
  title?: string
  slug?: string
  productType?: string
  releaseDate?: string | null
  storeLink?: string
  reviewsRating?: number
  reviewsCount?: number
  developers?: string[]
  publishers?: string[]
  operatingSystems?: string[]
  genres?: Array<{ name?: string }>
  price?: { final?: string; base?: string; discount?: string }
}

interface CatalogResponse {
  productCount?: number
  currentlyShownProductCount?: number
  products?: CatalogProduct[]
}

const clamp = (n: unknown, def: number, max: number) => Math.min(Math.max(Number(n) || def, 1), max)

const PLATFORMS: Record<string, string> = { windows: "Windows", mac: "macOS", linux: "Linux" }

function fmtProduct(p: CatalogProduct, i?: number): string {
  const pre = i === undefined ? "" : `${i + 1}. `
  const price = p.price?.final ? `${p.price.final}${p.price.discount ? ` (${p.price.discount} off ${p.price.base ?? ""})` : ""}` : "price n/a"
  const meta = [
    p.productType,
    p.operatingSystems?.length ? p.operatingSystems.map((o) => PLATFORMS[o] ?? o).join("/") : "",
    p.genres?.length ? p.genres.slice(0, 3).map((g) => g.name).filter(Boolean).join(", ") : "",
    // GOG exposes reviewsRating on a 0-50 scale, i.e. 43 -> 4.3 out of 5.
    typeof p.reviewsRating === "number" && p.reviewsRating > 0 ? `${(p.reviewsRating / 10).toFixed(1)}/5 (${p.reviewsCount ?? 0} reviews)` : "",
  ].filter(Boolean)
  const lines = [`${pre}${p.title ?? "Untitled"} — ${price}`]
  if (meta.length) lines.push(`   ${meta.join(" | ")}`)
  const dev = p.developers?.length ? `   by ${p.developers.slice(0, 2).join(", ")}` : ""
  if (dev) lines.push(dev)
  if (p.storeLink) lines.push(`   ${p.storeLink}`)
  return lines.join("\n")
}

const ORDERS: Record<string, string> = {
  trending: "desc:trending",
  newest: "desc:releaseDate",
  discount: "desc:discount",
  cheapest: "asc:price",
  rating: "desc:rating",
}

export type Order = keyof typeof ORDERS

export async function browseGames(args: { limit?: number; order?: Order }): Promise<string> {
  const limit = clamp(args.limit, 10, 20)
  const order = ORDERS[args.order ?? "trending"] ?? ORDERS.trending
  const d = await getJson<CatalogResponse>(`${CATALOG}?limit=${limit}&order=${order}&${LOCALE}`)
  const items = d.products ?? []
  if (!items.length) return "No GOG products returned."
  return `GOG games (${args.order ?? "trending"}), ${(d.productCount ?? items.length).toLocaleString()} in catalog:\n\n${items.map((p, i) => fmtProduct(p, i)).join("\n\n")}`
}

export async function searchGames(args: { query: string; limit?: number }): Promise<string> {
  const q = (args.query ?? "").trim()
  if (!q) return "Provide a search query."
  const limit = clamp(args.limit, 10, 20)
  const d = await getJson<CatalogResponse>(
    `${CATALOG}?query=like%3A${encodeURIComponent(q)}&limit=${limit}&order=${ORDERS.trending}&${LOCALE}`
  )
  const items = d.products ?? []
  if (!items.length) return `No GOG games match "${q}".`
  return `GOG games matching "${q}" (${(d.productCount ?? items.length).toLocaleString()} found):\n\n${items.map((p, i) => fmtProduct(p, i)).join("\n\n")}`
}

export async function deals(args: { limit?: number; minDiscount?: number }): Promise<string> {
  const limit = clamp(args.limit, 10, 20)
  const min = Math.min(Math.max(Number(args.minDiscount) || 50, 1), 99)
  const d = await getJson<CatalogResponse>(`${CATALOG}?limit=20&order=${ORDERS.discount}&${LOCALE}`)
  const items = (d.products ?? []).filter((p) => {
    const pct = Math.abs(Number(String(p.price?.discount ?? "").replace(/[^0-9.-]/g, "")))
    return Number.isFinite(pct) && pct >= min
  })
  if (!items.length) return `No GOG deals at ${min}% off or more right now.`
  return `GOG deals (${min}%+ off):\n\n${items.slice(0, limit).map((p, i) => fmtProduct(p, i)).join("\n\n")}`
}

export async function topRated(args: { limit?: number }): Promise<string> {
  const limit = clamp(args.limit, 10, 20)
  const d = await getJson<CatalogResponse>(`${CATALOG}?limit=${limit}&order=${ORDERS.rating}&${LOCALE}`)
  const items = d.products ?? []
  if (!items.length) return "No GOG products returned."
  return `Top-rated GOG games:\n\n${items.map((p, i) => fmtProduct(p, i)).join("\n\n")}`
}

export async function gamesByIds(args: { ids: string }): Promise<string> {
  const ids = String(args.ids ?? "")
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter((s) => /^\d+$/.test(s))
    .slice(0, 20)
  if (!ids.length) return "Provide one or more numeric product IDs, comma separated."
  const list = await getJson<any[]>(`${PRODUCTS}?ids=${ids.join(",")}`)
  if (!Array.isArray(list) || !list.length) return `No GOG products for ids ${ids.join(", ")}.`
  return (
    `${list.length} GOG product(s) (catalog metadata; call game_details for prices):\n\n` +
    // This endpoint returns catalog metadata only — no prices. Call
    // game_details for pricing.
    list
      .map((p, i) => {
        const platforms = Object.entries(p?.content_system_compatibility ?? {})
          .filter(([, v]) => v === true)
          .map(([k]) => PLATFORMS[k] ?? k)
        return [
          `${i + 1}. ${p?.title ?? "Untitled"}`,
          platforms.length ? `   ${platforms.join("/")}` : "",
          p?.slug ? `   https://www.gog.com/game/${p.slug}` : "",
        ]
          .filter(Boolean)
          .join("\n")
      })
      .join("\n\n")
  )
}

export async function gameDetails(args: { product_id: string }): Promise<string> {
  const id = Math.floor(Number(args.product_id ?? 0))
  if (!id) return "Provide a numeric product id (see search_games)."
  const d = await getJson<any>(`${PRODUCTS}/${id}?expand=description`)
  if (!d?.title) return `No GOG product with id ${id}.`
  const lines = [`${d.title}${d.is_coming_soon ? " [coming soon]" : ""}`]
  const price = d.price?.finalAmount ? `$${d.price.finalAmount}${Number(d.price.discount) > 0 ? ` (was $${d.price.baseAmount}, ${d.price.discount}% off)` : ""}` : ""
  if (price) lines.push(price)
  const platforms = Object.entries(d.content_system_compatibility ?? {})
    .filter(([, v]) => v === true)
    .map(([k]) => PLATFORMS[k] ?? k)
  if (platforms.length) lines.push(`Platforms: ${platforms.join("/")}`)
  const devs = Array.isArray(d.developers) ? d.developers.map((x: any) => x?.name).filter(Boolean) : []
  if (devs.length) lines.push(`Developer: ${devs.join(", ")}`)
  const genres = Array.isArray(d.genres) ? d.genres.map((g: any) => g?.name).filter(Boolean) : []
  if (genres.length) lines.push(`Genres: ${genres.join(", ")}`)
  if (d.rating) lines.push(`ESRB: ${d.rating}`)
  if (d.release_date) lines.push(`Released: ${d.release_date}`)
  const lead = d.description?.lead ? String(d.description.lead) : ""
  const clean = lead.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
  if (clean) lines.push("", clean)
  if (d.links?.purchase_link) lines.push("", `Buy: ${d.links.purchase_link}`)
  else if (d.purchase_link) lines.push("", `Buy: ${d.purchase_link}`)
  return lines.join("\n")
}
