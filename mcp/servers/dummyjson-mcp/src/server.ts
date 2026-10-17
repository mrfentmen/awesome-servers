import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { products, recipes, catalogIndex } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "dummyjson-mcp", version: "1.0.0" })
  server.registerTool(
    "products",
    {
      title: "Products",
      description: "List products.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await products(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "recipes",
    {
      title: "Recipes",
      description: "List recipes.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await recipes(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "paged_list",
    {
      title: "Paged list",
      description: "Page and sort DummyJSON products, users, posts, quotes or recipes, with the real total so skip can be walked.",
      inputSchema: z.object( { resource: z.string().describe("products, users, posts, quotes or recipes."), limit: z.number().describe("How many to show, 1-100. Defaults to 10.").optional(), skip: z.number().describe("How many to skip, for paging. Defaults to 0.").optional(), sortBy: z.string().describe("A verified sort field for the resource, like price for products.").optional(), order: z.string().describe("asc or desc. Defaults to asc.").optional(), category: z.string().describe("Product category slug from catalog_index. Products only.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement list locally (paywall removed)
    try { return textError("Not yet implemented: list") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "product_search",
    {
      title: "Product search",
      description: "Full text search across the DummyJSON product catalogue, with paging and the total match count.",
      inputSchema: z.object( { query: z.string().describe("Search text, like phone or chicken."), limit: z.number().describe("How many to show, 1-100. Defaults to 10.").optional(), skip: z.number().describe("How many to skip, for paging. Defaults to 0.").optional(), sortBy: z.string().describe("price, rating, stock or title.").optional(), order: z.string().describe("asc or desc. Defaults to asc.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement search locally (paywall removed)
    try { return textError("Not yet implemented: search") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "catalog_index",
    {
      title: "Catalog index",
      description: "Every DummyJSON product category with its slug, and every recipe tag.",
      inputSchema: z.object( {} ),
      annotations: READ_ONLY,
    },
    async () => {
    try { return text(await catalogIndex()) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
