import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { getProduct, searchProducts } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "openfoodfacts-mcp", version: "1.0.0" })

  server.tool(
    "get_product",
    "Product details for one barcode",
    { barcode: z.string().min(6).describe("Product barcode, e.g. 3017620422003") },
    async ({ barcode }) => {
      try {
        return text(await getProduct(barcode))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_products",
    "Search food products by name",
    { query: z.string().min(1).describe("Product name, e.g. peanut butter"), limit: z.number().int().min(1).max(20).default(5).describe("How many products") },
    async ({ query, limit }) => {
      try {
        return text(await searchProducts(query, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
