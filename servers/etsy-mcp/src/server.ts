import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { EtsyError, findShop, formatListing, formatShop, getListing, shopListings } from "./api.js"

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
        return textError(errorMessage(e))
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
        return textError(errorMessage(e))
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
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof EtsyError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
