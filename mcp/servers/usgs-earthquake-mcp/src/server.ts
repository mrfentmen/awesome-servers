import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { recentEarthquakes } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "usgs-earthquake-mcp", version: "1.0.0" })

  server.tool(
    "recent_earthquakes",
    "Latest earthquakes, optionally above a magnitude",
    { min_magnitude: z.number().min(0).max(10).default(2.5).describe("Minimum magnitude"), limit: z.number().int().min(1).max(50).default(10).describe("How many quakes") },
    async ({ min_magnitude, limit }) => {
      try {
        return text(await recentEarthquakes(min_magnitude, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
