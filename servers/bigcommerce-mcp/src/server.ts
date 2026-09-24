import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { BigCommerceError, formatOrder, formatProduct, getProduct, listOrders, listProducts } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "bigcommerce-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_products",
    {
      title: "List products",
      description: "BigCommerce catalog products with prices, SKUs, availability.",
      inputSchema: z.object({
        keyword: z.string().default("").describe("Search keyword, empty = all"),
        limit: z.number().int().min(1).max(250).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ keyword, limit }) => {
      try {
        const rows = await listProducts(keyword, limit)
        if (rows.length === 0) return text("No products.")
        return text(rows.map((p, i) => formatProduct(p, i)).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_product",
    {
      title: "Get product",
      description: "One BigCommerce product by id.",
      inputSchema: z.object({
        id: z.string().describe("Numeric product id"),
      }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        return text(formatProduct(await getProduct(id)))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_orders",
    {
      title: "List orders",
      description: "Recent BigCommerce orders: status, totals, customers.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(250).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        const rows = await listOrders(limit)
        if (rows.length === 0) return text("No orders.")
        return text(rows.map((o, i) => formatOrder(o, i)).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof BigCommerceError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
