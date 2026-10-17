import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { EtsyError, findShop, formatListing, formatShop, getListing, shopListings, shopCatalogue, listingVariations, featuredListings } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "etsy-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "find_shop",
    {
      title: "Find shop",
      description: "Find Etsy shops by name: rating, listings count, URL.",
      inputSchema: z.object({
        name: z.string().describe("Shop name, e.g. 'ToteBags'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ name }) => {
      try {
        const rows = await findShop(name)
        if (rows.length === 0) return text(`No Etsy shops match "${name}".`)
        return text(rows.map((s, i) => formatShop(s, i)).join("\n\n"))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "shop_listings",
    {
      title: "Shop listings",
      description: "Active listings of an Etsy shop: titles, prices, quantities, links.",
      inputSchema: z.object({
        shop_id: z.string().describe("Numeric shop id (use find_shop)"),
        limit: z.number().int().min(1).max(100).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ shop_id, limit }) => {
      try {
        const rows = await shopListings(shop_id, limit)
        if (rows.length === 0) return text(`No active listings for shop ${shop_id}.`)
        return text(rows.map((l, i) => formatListing(l, i)).join("\n\n"))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "get_listing",
    {
      title: "Get listing",
      description: "One Etsy listing: title, price, quantity, link, image.",
      inputSchema: z.object({
        id: z.string().describe("Numeric listing id"),
      }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        return text(formatListing(await getListing(id)))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "shop_catalogue",
    {
      title: "Filtered shop catalogue with price distribution",
      description: "Reads a shop's active listings through the documented filters, keywords, price range, taxonomy id, sort order and offset, and reports the price distribution, currency mix and stock state across the page. The existing shop_listings returns the first listings in whatever order Etsy gives and caps at 100, so a shop with several hundred products can be neither fully walked nor filtered at all.",
      inputSchema: z.object({
        shop_id: z.string().describe("Numeric Etsy shop id."),
        keywords: z.string().optional().describe("Filter by keywords within the shop."),
        price_min: z.number().optional().describe("Minimum price filter."),
        price_max: z.number().optional().describe("Maximum price filter."),
        taxonomy_id: z.number().int().optional().describe("Etsy taxonomy id to filter by."),
        sort_on: z.string().optional().describe("Sort field, e.g. created, updated, price, quantity, title, score."),
        sort_order: z.enum(["asc", "desc"]).optional().describe("Sort direction."),
        limit: z.number().int().min(1).max(100).default(25).describe("Listings per page, default 25. Etsy caps this at 100."),
        offset: z.number().int().min(0).default(0).describe("Offset for paging through a large shop, default 0"),
        analyse: z.boolean().default(true).describe("Include the price and stock distribution. Default true"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await shopCatalogue(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "listing_variations",
    {
      title: "Per-option variation matrix",
      description: "Builds the full option matrix for a listing, with the price, stock state, quantity and SKU of every size and colour individually. The existing get_listing reads a single top-level price, so a listing offered in five sizes and three colours reports one figure that may correspond to no purchasable combination at all. Reports when Etsy publishes no availability flag or no per-option quantity, rather than treating absence as in stock.",
      inputSchema: z.object({
        listing_id: z.string().describe("Numeric Etsy listing id."),
        only_available: z.boolean().default(true).describe("Say explicitly when nothing in the listing is purchasable. Default true"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await listingVariations(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "featured_listings",
    {
      title: "Featured listings",
      description: "Lists the listings a shop has chosen to feature, which is a merchant-curated merchandising decision that no combination of price, age or quantity reveals and that the active-listings endpoint cannot show. Also reports how many active listings the shop has and how many featured items are at zero quantity, since a shop can feature something it cannot sell.",
      inputSchema: z.object({
        shop_id: z.string().describe("Numeric Etsy shop id."),
        limit: z.number().int().min(1).max(100).default(25).describe("Featured listings to list, default 25"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await featuredListings(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof EtsyError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
