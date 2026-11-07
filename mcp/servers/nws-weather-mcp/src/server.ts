import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { forecast } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "nws-weather-mcp", version: "1.0.0" })

  server.tool(
    "forecast",
    "Daily forecast for a latitude and longitude",
    { latitude: z.number().min(-90).max(90).describe("Latitude, e.g. 39.7456"), longitude: z.number().min(-180).max(180).describe("Longitude, e.g. -97.0892"), periods: z.number().int().min(1).max(14).default(5).describe("How many periods") },
    async ({ latitude, longitude, periods }) => {
      try {
        return text(await forecast(latitude, longitude, periods))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
