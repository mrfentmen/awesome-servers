import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { date, latest } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "nasa-epic-mcp", version: "1.0.0" })
  server.registerTool(
    "latest",
    {
      title: "Latest",
      description: "Latest Earth images from EPIC.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await latest(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "date",
    {
      title: "Date",
      description: "Earth images for a date.",
      inputSchema: z.object( { date: z.string().describe("Date like 2026-08-01.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await date(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "enhanced_latest",
    {
      title: "Latest enhanced images",
      description: "Latest Earth images from EPIC's enhanced product - the reprocessed imagery used for ozone and aerosol retrieval, with the image centroid.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: enhanced_latest ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_nasa_epic_enhanced_latest", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "enhanced_date",
    {
      title: "Enhanced images for a date",
      description: "EPIC enhanced-product Earth images for one date, with the image centroid and archive link.",
      inputSchema: z.object( { date: z.string().describe("Date like 2026-09-23.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: enhanced_date ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_nasa_epic_enhanced_date", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
