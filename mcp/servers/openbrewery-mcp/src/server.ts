import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { m0_search, m1_byCity, m1_byState, m1_search } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'openbrewery-mcp', version: '1.0.0' })
server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search breweries by name or city.",
      inputSchema: z.object( { query: z.string().describe("Search terms.").optional(), city: z.string().describe("City name.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_search(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "by_city",
    {
      title: "By city",
      description: "List breweries in a city.",
      inputSchema: z.object( { city: z.string().describe("City name."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_byCity(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "by_state",
    {
      title: "By state",
      description: "List breweries in a state.",
      inputSchema: z.object( { state: z.string().describe("State name."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_byState(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "brewery_detail",
    {
      title: "Brewery detail",
      description: "One brewery by its Open Brewery DB id, with type, full address, phone, website and coordinates.",
      inputSchema: z.object( { id: z.string().min(1).max(64) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: brewery_detail ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_openbrewery_brewery_detail", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "by_type",
    {
      title: "By type",
      description: "List breweries of one brewery type, such as micro, brewpub, large or contract.",
      inputSchema: z.object( { type: z.string().min(1).max(40), limit: z.number().int().min(1).max(25).default(10) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: by_type ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_openbrewery_by_type", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
