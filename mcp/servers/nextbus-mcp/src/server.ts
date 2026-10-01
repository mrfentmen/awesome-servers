import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { agencies, predictions, routes, routeFrequency } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "nextbus-mcp", version: "1.0.0" })
  server.registerTool(
    "agencies",
    {
      title: "Agencies",
      description: "List transit agencies.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await agencies(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "routes",
    {
      title: "Routes",
      description: "List routes for an agency.",
      inputSchema: z.object( { agency: z.string().describe("Agency tag.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await routes(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "predictions",
    {
      title: "Predictions",
      description: "Get arrival predictions for a stop.",
      inputSchema: z.object( { agency: z.string().describe("Agency tag."), stop: z.string().describe("Stop id."), route: z.string().describe("Route tag.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await predictions(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "route_timetable",
    {
      title: "Route timetable",
      description: "Full published timetable for a route: stop sequence, first and last departure, and the typical run time between consecutive stops.",
      inputSchema: z.object( { agency: z.string().describe("Agency tag."), route: z.string().describe("Route tag."), stopId: z.string().describe("Schedule stop id, 0 for all.").default("0"), maxStops: z.number().int().min(1).max(60).default(20) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: route_timetable ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_nextbus_route_timetable", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "route_frequency",
    {
      title: "Route frequency",
      description: "How often a route actually runs at each stop: median headway plus the tightest and longest daytime gap from the published timetable.",
      inputSchema: z.object( { agency: z.string().describe("Agency tag."), route: z.string().describe("Route tag."), stopId: z.string().describe("Schedule stop id, 0 for all.").default("0"), maxStops: z.number().int().min(1).max(60).default(20) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await routeFrequency(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
