import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { latest, search } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "guardian-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search Guardian articles.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "latest",
    {
      title: "Latest",
      description: "Latest Guardian articles.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await latest(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "section_feed",
    {
      title: "Section feed",
      description: "The Guardian's RSS feed for one section, which needs no API key, so you can follow a beat without the open API.",
      inputSchema: z.object( { section: z.string().describe("Section slug, e.g. environment or world/uk."), limit: z.number().describe("Max items.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: section_feed ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_guardian_section_feed", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "front_page_feed",
    {
      title: "Front page feed",
      description: "The Guardian's front page RSS feed, keyless: everything currently on the front page with its standfirst and link.",
      inputSchema: z.object( { limit: z.number().describe("Max items.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: front_page_feed ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_guardian_front_page_feed", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
