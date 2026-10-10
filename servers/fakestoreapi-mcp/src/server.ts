import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { categories, product, products, catalogSummary } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "fakestoreapi-mcp", version: "1.0.0" })
  server.registerTool(
    "products",
    {
      title: "Products",
      description: "List products.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await products(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "product",
    {
      title: "Product",
      description: "Get a product by id.",
      inputSchema: z.object( { id: z.number().describe("Product id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await product(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "categories",
    {
      title: "Categories",
      description: "List product categories.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await categories(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "products_by_category",
    {
      title: "Products by category",
      description: "One category's products sorted by price, from the real category names the store publishes. An unknown category is rejected with the four real names.",
      inputSchema: z.object( { category: z.string().describe("Category name, like electronics or jewelery."), sort: z.string().describe("asc or desc by price. Defaults to asc.").optional(), limit: z.number().describe("How many products to show, 1-50. Defaults to 10.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: products_by_category ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_fakestoreapi_products_by_category", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "catalog_summary",
    {
      title: "Catalogue summary",
      description: "The whole catalogue in one view: product count per category, real price ranges and averages, and the best rated items.",
      inputSchema: z.object( { top: z.number().describe("How many best-rated products to list, 1-10. Defaults to 3.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await catalogSummary(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "cart_detail",
    {
      title: "Cart detail",
      description: "One cart with every line item resolved to its product title and price, plus the cart total.",
      inputSchema: z.object( { id: z.number().describe("Cart id, 1 to 7.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: cart_detail ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_fakestoreapi_cart_detail", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
