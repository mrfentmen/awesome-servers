import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { allProducts, productCycles, productSearch } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "endoflife-mcp", version: "1.0.0" })
  server.registerTool(
    "product_cycles",
    {
      title: "Product cycles",
      description: "Release and EOL dates for a product.",
      inputSchema: z.object( { product: z.string().describe("Product name like nodejs or python.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await productCycles(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "all_products",
    {
      title: "All products",
      description: "List all tracked products.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await allProducts(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "product_profile",
    {
      title: "Product profile",
      description: "Full endoflife.date profile for one product: aliases, version command, links, and every release cycle with its support dates and latest patch.",
      inputSchema: z.object( { product: z.string().describe("Product name like nodejs or ubuntu."), cycles: z.number().describe("How many release cycles to list, 1-100. Defaults to 15.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: product_profile ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_endoflife_product_profile", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "cycle_support",
    {
      title: "Cycle support",
      description: "Exact support timeline for one release cycle: release date, LTS date, each support stage's end date, and days remaining or elapsed.",
      inputSchema: z.object( { product: z.string().describe("Product name like nodejs or ubuntu."), cycle: z.string().describe("Release cycle like 20 or 24.04.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: cycle_support ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_endoflife_cycle_support", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "product_search",
    {
      title: "Product search",
      description: "Find products endoflife.date tracks by name, alias, tag or category, or list the categories it covers.",
      inputSchema: z.object( { query: z.string().describe("Text to look for in the product name, label, alias or tag.").optional(), category: z.string().describe("Only products in this category, like os or lang.").optional(), tag: z.string().describe("Only products carrying this exact tag.").optional(), limit: z.number().describe("How many products to list, 1-100.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await productSearch(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
