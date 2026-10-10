import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { sensors, trackDetail, tracks, platformStatistics } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "envirocar-mcp", version: "1.0.0" })
  server.registerTool(
    "tracks",
    {
      title: "Tracks",
      description: "List recent tracks.",
      inputSchema: z.object( { limit: z.number().describe("Max tracks.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await tracks(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "track_detail",
    {
      title: "Track detail",
      description: "Get a track by id.",
      inputSchema: z.object( { id: z.string().describe("Track id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await trackDetail(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "sensors",
    {
      title: "Sensors",
      description: "List available sensor definitions.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await sensors(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "track_statistics",
    {
      title: "Track statistics",
      description: "Per-phenomenon average, minimum and maximum for one enviroCar track, so you can read a drive rather than a single sample.",
      inputSchema: z.object( { id: z.string().describe("Track id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: track_statistics ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_envirocar_track_statistics", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "phenomenon_catalog",
    {
      title: "Phenomenon catalog",
      description: "The environmental and engine quantities enviroCar measures, with the unit each is reported in.",
      inputSchema: z.object( {  } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: phenomenon_catalog ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_envirocar_phenomenon_catalog", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "platform_statistics",
    {
      title: "Platform statistics",
      description: "Platform-wide enviroCar coverage per phenomenon: average, measurement count, tracks, contributors and sensors.",
      inputSchema: z.object( { limit: z.number().describe("How many phenomena, 1-30.").optional(), phenomenon: z.string().describe("Only phenomena whose name contains this text.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await platformStatistics(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
