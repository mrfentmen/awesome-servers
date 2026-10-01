import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { day } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "muffinlabs-mcp", version: "1.0.0" })
  server.registerTool(
    "day",
    {
      title: "Day",
      description: "Events for a date.",
      inputSchema: z.object( { month: z.number().describe("Month.").optional(), day: z.number().describe("Day.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await day(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "most_read_articles",
    {
      title: "Most read articles",
      description: "The Wikipedia articles that were most read on a given day, with rank, view count, description and a short extract.",
      inputSchema: z.object({
        date: z.string().describe("Date as YYYY/MM/DD. Defaults to today (UTC).").optional(),
        limit: z.number().describe("Max articles, 1-25, default 10.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: most_read_articles ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_muffinlabs_most_read_articles", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "lookup_wikidata_item",
    {
      title: "Look up a Wikidata item",
      description: "Search Wikidata for a person, place, event or work and get its item id, label and short description.",
      inputSchema: z.object({
        query: z.string().describe("Name to search Wikidata for."),
        limit: z.number().describe("Max results, 1-20, default 5.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: lookup_wikidata_item ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_muffinlabs_lookup_wikidata_item", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
