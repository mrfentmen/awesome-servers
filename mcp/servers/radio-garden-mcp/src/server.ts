import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { places, search } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "radio-garden-mcp", version: "1.0.0" })
  server.registerTool(
    "places",
    {
      title: "Places",
      description: "List radio places.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await places(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search places.",
      inputSchema: z.object( { query: z.string().describe("Search terms.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "place_detail",
    {
      title: "Place detail",
      description: "One Radio Garden place by id: country, coordinates, how many stations Radio Garden files under it and its page URL.",
      inputSchema: z.object( { id: z.string().describe("Radio Garden place id, e.g. 6lcXHtKK.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement detail locally (paywall removed)
    try { return textError("Not yet implemented: detail") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "places_near",
    {
      title: "Places near",
      description: "Radio Garden places within a radius of a point, with distance, country and station count, biggest first.",
      inputSchema: z.object( { lat: z.number().min(-90).max(90).describe("Latitude."), lon: z.number().min(-180).max(180).describe("Longitude."), radiusKm: z.number().int().min(1).max(20000).default(100), limit: z.number().int().min(1).max(30).default(10) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement near locally (paywall removed)
    try { return textError("Not yet implemented: near") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
