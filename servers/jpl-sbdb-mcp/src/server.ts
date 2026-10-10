import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { browse, object } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "jpl-sbdb-mcp", version: "1.0.0" })
  server.registerTool(
    "object",
    {
      title: "Object",
      description: "Small body by designation or name.",
      inputSchema: z.object( { name: z.string().describe("Designation like 1P or 433.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await object(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "browse",
    {
      title: "Browse",
      description: "Browse small bodies.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await browse(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "object_physical",
    {
      title: "Object physical",
      description: "Physical parameters of a small body from JPL: diameter, absolute magnitude, albedo, rotation period, spectral type, GM and notes.",
      inputSchema: z.object({ name: z.string().describe("Designation or name, e.g. '433' or '1P'."), }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: object_physical ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_jpl_sbdb_object_physical", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "close_approaches",
    {
      title: "Close approaches",
      description: "Asteroid and comet close approaches to Earth in a date window, with distance, relative velocity and v-infinity, from the JPL close approach database.",
      inputSchema: z.object({
        date_min: z.string().describe("Start date as YYYY-MM-DD."),
        date_max: z.string().describe("End date as YYYY-MM-DD."),
        dist_max: z.number().describe("Largest approach distance in au, 0-1, default 0.05.").optional(),
        limit: z.number().describe("Max rows, 1-100, default 10.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: close_approaches ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_jpl_sbdb_close_approaches", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "query_group",
    {
      title: "Query group",
      description: "Query the JPL small body database by orbit group: neo (near-Earth), pha (potentially hazardous) or a class such as amo, apo, ate.",
      inputSchema: z.object({ group: z.string().describe("neo, pha, amo, apo or ate. Defaults to neo.").optional(), limit: z.number().describe("Max rows, 1-50, default 10.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: query_group ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_jpl_sbdb_query_group", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
