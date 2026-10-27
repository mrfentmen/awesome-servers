import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  nearby,
  getPoi,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "openchargemap-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "nearby",
    {
      title: "Nearby chargers",
      description: "Charging points near coordinates, with distance.",
      inputSchema: z.object({
        latitude: z.string().describe("e.g. 40.7128."),
        longitude: z.string().describe("e.g. -74.0060."),
        distance: z.string().describe("Radius miles (default 25).").optional(),
        max_results: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ latitude, longitude, distance, max_results }) => {
      try {
        return text(await nearby(latitude, longitude, distance, max_results));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_poi",
    {
      title: "Charger details",
      description: "One charge point by id, with connectors and operator.",
      inputSchema: z.object({
        poi_id: z.string().describe("Chargepoint ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ poi_id }) => {
      try {
        return text(await getPoi(poi_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}