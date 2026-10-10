import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { latest, search, listCategories } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "techcrunch-mcp", version: "1.0.0" })
  server.registerTool(
    "latest",
    {
      title: "Latest",
      description: "Latest TechCrunch posts.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await latest(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search TechCrunch posts by text.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "list_categories",
    {
      title: "List categories",
      description: "TechCrunch editorial categories with their ids and post counts.",
      inputSchema: z.object( { limit: z.number().describe("Max categories.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await listCategories(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "posts_by_category",
    {
      title: "Posts by category",
      description: "Latest TechCrunch posts inside one editorial category, selected by its id from list_categories.",
      inputSchema: z.object( { category: z.number().describe("Category id from list_categories."), limit: z.number().describe("Max posts.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: posts_by_category ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_techcrunch_posts_by_category", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
