import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { recent, significant } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "seismicportal-mcp", version: "1.0.0" })
  server.registerTool(
    "recent",
    {
      title: "Recent",
      description: "Recent earthquakes.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await recent(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "significant",
    {
      title: "Significant",
      description: "Significant earthquakes.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await significant(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "largest",
    {
      title: "Largest earthquakes",
      description: "Earthquakes ordered by magnitude, biggest first, with region, depth, event type and coordinates.",
      inputSchema: z.object( { limit: z.number().describe("Max results, 1 to 50.").optional(), min_magnitude: z.number().describe("Lowest magnitude to include, -2 to 10.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: largest ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_seismicportal_largest", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "in_box",
    {
      title: "Earthquakes in a box",
      description: "Earthquakes inside a latitude and longitude bounding box above a magnitude floor, with region, depth and coordinates.",
      inputSchema: z.object( { min_lat: z.number().describe("South edge, -90 to 90."), min_lon: z.number().describe("West edge, -90 to 90."), max_lat: z.number().describe("North edge, -90 to 90."), max_lon: z.number().describe("East edge, -90 to 90."), min_magnitude: z.number().describe("Lowest magnitude to include, -2 to 10.").optional(), limit: z.number().describe("Max results, 1 to 50.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: in_box ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_seismicportal_in_box", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
