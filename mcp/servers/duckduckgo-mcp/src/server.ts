import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { instantAnswer, answerDiagnostics } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "duckduckgo-mcp", version: "1.0.0" })
  server.registerTool(
    "instant_answer",
    {
      title: "Instant answer",
      description: "Instant answer for a query.",
      inputSchema: z.object( { query: z.string().describe("The query.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await instantAnswer(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "entity_infobox",
    {
      title: "Entity infobox",
      description: "Read the structured infobox DuckDuckGo holds for an entity, giving labelled fields such as developer and first appeared, plus the official website, domain and image.",
      inputSchema: z.object( { query: z.string().describe("Entity name, e.g. Rust."), limit: z.number().describe("Max fields.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: entity_infobox ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_duckduckgo_entity_infobox", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "web_results",
    {
      title: "Web results",
      description: "Fetch DuckDuckGo's web results for a query as clean title and URL pairs, parsed out of the raw result markup, along with related topics and the entity heading.",
      inputSchema: z.object( { query: z.string().describe("Search query."), limit: z.number().describe("Max results.").optional(), region: z.string().describe("Region code such as wt-wt or us-en.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: web_results ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_duckduckgo_web_results", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "answer_diagnostics",
    {
      title: "Answer diagnostics",
      description: "Explain what DuckDuckGo actually returned for a query by reporting which Instant Answer fields were populated, which were empty and whether related topics nest, so an empty result is not a dead end.",
      inputSchema: z.object( { query: z.string().describe("Query to diagnose.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await answerDiagnostics(args)) } catch (e) { return textError(e instanceof Error ? `Error: ${e.message}` : String(e)) }
  }
  )

  return server
}
