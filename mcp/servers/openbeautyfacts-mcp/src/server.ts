import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { productByBarcode, searchByBrand, searchProducts, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "openbeautyfacts-mcp", version: "1.0.1" })

  server.tool(
    "product_by_barcode",
    "One cosmetic product by its barcode, with ingredients.",
    {
      barcode: z.string().regex(/^\d{6,14}$/).describe("Product barcode, e.g. 4005900980298")
    },
    async (a) => {
      try {
        return text(await productByBarcode(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_products",
    "Search products by name or other text.",
    {
      term: z.string().min(2).describe("Search text, e.g. shampoo or argan oil"),
      limit: z.number().int().min(1).max(20).default(5).describe("Products to return")
    },
    async (a) => {
      try {
        return text(await searchProducts(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_by_brand",
    "Products from one brand.",
    {
      brand: z.string().min(2).describe("Brand tag, e.g. nivea or loreal"),
      limit: z.number().int().min(1).max(20).default(5).describe("Products to return")
    },
    async (a) => {
      try {
        return text(await searchByBrand(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
