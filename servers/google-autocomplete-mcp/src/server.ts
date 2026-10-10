import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { suggest } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "google-autocomplete-mcp", version: "1.0.0" })
  server.registerTool(
    "suggest",
    {
      title: "Suggest",
      description: "Search suggestions for a query.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await suggest(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "youtube_suggest",
    {
      title: "YouTube suggestions",
      description: "Autocomplete suggestions drawn from YouTube search rather than Google web search.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().int().min(1).max(20).default(10).describe("Max suggestions.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: youtube_suggest ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_google_autocomplete_youtube_suggest", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "localized_suggest",
    {
      title: "Localized suggestions",
      description: "Autocomplete suggestions for a query as Google sees them in another language or country, e.g. hl \"de\" or gl \"fr\".",
      inputSchema: z.object( { query: z.string().describe("Search terms."), language: z.string().max(8).describe("Interface language code, e.g. \"de\".").optional(), country: z.string().max(4).describe("Two letter country code, e.g. \"fr\".").optional(), limit: z.number().int().min(1).max(20).default(10).describe("Max suggestions.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: localized_suggest ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_google_autocomplete_localized_suggest", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
