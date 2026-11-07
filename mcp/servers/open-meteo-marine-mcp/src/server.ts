import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { marineConditions } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "open-meteo-marine-mcp", version: "1.0.0" })

  server.tool(
    "marine_conditions",
    "Current sea conditions for a coordinate",
    { latitude: z.number().min(-90).max(90).describe("Latitude over water"), longitude: z.number().min(-180).max(180).describe("Longitude over water") },
    async ({ latitude, longitude }) => {
      try {
        return text(await marineConditions(latitude, longitude))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
