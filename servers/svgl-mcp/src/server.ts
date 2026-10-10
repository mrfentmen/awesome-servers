import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { categories, logos } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "svgl-mcp", version: "1.0.0" })
  server.registerTool(
    "logos",
    {
      title: "Logos",
      description: "List logos.",
      inputSchema: z.object( { category: z.string().describe("Optional category filter.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await logos(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "categories",
    {
      title: "Categories",
      description: "List categories.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await categories(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "search_logos",
    {
      title: "Search logos",
      description: "Search the whole SVGL library by logo title or category, returning each logo's SVG file, brand site and brand asset page.",
      inputSchema: z.object( { query: z.string().describe("Text to match in a logo title or category, e.g. vercel."), limit: z.number().int().min(1).max(50).default(15).describe("Max results.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: search_logos ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_svgl_search_logos", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
