import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getTrails,
  getTrailById,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "hikingproject-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_trails",
    {
      title: "Find nearby trails",
      description: "Hiking Project trails near coordinates with difficulty, stars, ascent and conditions.",
      inputSchema: z.object({
        lat: z.number().describe("Latitude"),
        lon: z.number().describe("Longitude"),
        maxDistance: z.number().default(10).describe("Miles radius"),
        maxResults: z.number().default(10).describe("How many trails"),
      }),
      annotations: READ_ONLY,
    },
    async ({ lat, lon, maxDistance, maxResults }) => {
      try {
        return text(await getTrails(lat, lon, maxDistance, maxResults));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_trail_by_id",
    {
      title: "Get trail detail",
      description: "Full Hiking Project trail record by id.",
      inputSchema: z.object({
        ids: z.string().describe("Comma-separated trail ids"),
      }),
      annotations: READ_ONLY,
    },
    async ({ ids }) => {
      try {
        return text(await getTrailById(ids));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
