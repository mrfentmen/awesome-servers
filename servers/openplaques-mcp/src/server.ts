import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { recent, search } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "openplaques-mcp", version: "1.0.0" })
  server.registerTool(
    "recent",
    {
      title: "Recent",
      description: "Recent plaques.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await recent(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search plaques by inscription.",
      inputSchema: z.object( { query: z.string().describe("Search text."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "plaque",
    {
      title: "Plaque",
      description: "One OpenPlaques record in full: inscription, subjects, address, erection date, whether it is still current, coordinates and photo.",
      inputSchema: z.object( { id: z.string().describe("Numeric OpenPlaques id, e.g. 1.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: plaque ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_openplaques_plaque", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "plaque_photos",
    {
      title: "Plaque photos",
      description: "Photographs of one OpenPlaques plaque, with photographer credits and file descriptions.",
      inputSchema: z.object( { id: z.string().describe("Numeric OpenPlaques id, e.g. 1.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: plaque_photos ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_openplaques_plaque_photos", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
