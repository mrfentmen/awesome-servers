import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { random, batch, search, rateLimit } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "ron-swanson-mcp", version: "1.0.0" })
  server.registerTool(
    "random",
    {
      title: "Random",
      description: "A random Ron Swanson quote.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await random(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "batch",
    {
      title: "Batch of quotes",
      description: "Draw several Ron Swanson quotes at once instead of one at a time, up to 25 in a single request.",
      inputSchema: z.object( { count: z.number().describe("How many quotes to draw, 1-25.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await batch(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "search",
    {
      title: "Search quotes",
      description: "Every Ron Swanson quote that contains a word or phrase, matched without case sensitivity across the whole corpus.",
      inputSchema: z.object( { term: z.string().describe("Word or phrase to look for, e.g. bacon."), limit: z.number().describe("Max matches to show, 1-50.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "catalogue",
    {
      title: "Quote catalogue",
      description: "Page through the complete Ron Swanson quote corpus the API holds, numbered so a quote can be referred to by position.",
      inputSchema: z.object( { limit: z.number().describe("Quotes per page, 1-50.").optional(), offset: z.number().describe("First quote position to show, 0-based.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: catalogue ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_ron_swanson_catalogue", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "longest",
    {
      title: "Longest quotes",
      description: "The longest quotes in the corpus with their character counts, plus the total word count of the whole corpus.",
      inputSchema: z.object( { limit: z.number().describe("How many to list, 1-20.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: longest ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_ron_swanson_longest", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "rate_limit",
    {
      title: "API rate limit",
      description: "Read the request budget the Ron Swanson quotes API reports in its own response headers, plus the current reset time.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await rateLimit(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
