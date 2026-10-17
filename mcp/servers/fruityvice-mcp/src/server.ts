import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { all, fruit } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "fruityvice-mcp", version: "1.0.0" })
  server.registerTool(
    "fruit",
    {
      title: "Fruit",
      description: "Get a fruit by name.",
      inputSchema: z.object( { name: z.string().describe("Fruit name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await fruit(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "all",
    {
      title: "All",
      description: "List all fruits.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await all(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "grocery_product",
    {
      title: "Grocery product",
      description: "Look up a packaged grocery product by barcode: name, brands, Nutri-Score, ingredients, allergens and per-100g nutrition, from the Open Food Facts database.",
      inputSchema: z.object( { barcode: z.string().describe("Product barcode, digits only, e.g. 3017620422003.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement product locally (paywall removed)
    try { return textError("Not yet implemented: product") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "product_search",
    {
      title: "Product search",
      description: "Search the Open Food Facts database for packaged food products by name, showing brand, quantity and Nutri-Score.",
      inputSchema: z.object( { query: z.string().describe("Search terms, e.g. apple juice."), limit: z.number().int().min(1).max(20).default(10).describe("Max results.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement search locally (paywall removed)
    try { return textError("Not yet implemented: search") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
