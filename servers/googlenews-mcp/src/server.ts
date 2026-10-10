import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { search } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "googlenews-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search Google News headlines.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "top_stories",
    {
      title: "Top stories",
      description: "The Google News front page feed: the headlines Google is currently leading with, in a chosen locale.",
      inputSchema: z.object({ limit: z.number().describe("Max headlines, 1-25, default 10.").optional(), locale: z.string().describe("Locale like en-US or en-GB. Defaults to en-US.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: top_stories ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_googlenews_top_stories", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "topic_headlines",
    {
      title: "Topic headlines",
      description: "Headlines from one Google News topic section: WORLD, NATION, BUSINESS, TECHNOLOGY, ENTERTAINMENT, SPORTS, SCIENCE or HEALTH.",
      inputSchema: z.object({ topic: z.string().describe("Topic name, for example SCIENCE or TECHNOLOGY."), limit: z.number().describe("Max headlines, 1-25, default 10.").optional(), locale: z.string().describe("Locale like en-US. Defaults to en-US.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: topic_headlines ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_googlenews_topic_headlines", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
