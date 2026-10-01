import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { search, guideSections, pageBacklinks } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "wikivoyage-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search Wikivoyage travel guides.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "guide_article",
    {
      title: "Guide article",
      description: "The plain-text introduction of a Wikivoyage travel guide, following redirects, so you get the overview without the wiki markup.",
      inputSchema: z.object( { title: z.string().describe("Page title, e.g. Tokyo.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: guide_article ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_wikivoyage_guide_article", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "guide_sections",
    {
      title: "Guide sections",
      description: "The table of contents of a Wikivoyage guide with heading levels, so you can see what a guide covers before pulling it.",
      inputSchema: z.object( { title: z.string().describe("Page title, e.g. Tokyo.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await guideSections(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "nearby_guides",
    {
      title: "Nearby guides",
      description: "Wikivoyage travel guides mapped closest to a coordinate, with the distance to each one.",
      inputSchema: z.object( { lat: z.number().describe("Latitude, -90 to 90."), lon: z.number().describe("Longitude, -180 to 180."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: nearby_guides ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_wikivoyage_nearby_guides", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "page_history",
    {
      title: "Page history",
      description: "Inspect recent revisions of a page, including revision IDs, editors, timestamps and edit summaries.",
      inputSchema: z.object( { title: z.string().describe("Exact page title."), limit: z.number().describe("Maximum results, 1-30.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: page_history ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_wikivoyage_page_history", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "backlinks",
    {
      title: "Page backlinks",
      description: "Find pages that link to an exact wiki page.",
      inputSchema: z.object( { title: z.string().describe("Exact target page title."), limit: z.number().describe("Maximum results, 1-30.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await pageBacklinks(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
