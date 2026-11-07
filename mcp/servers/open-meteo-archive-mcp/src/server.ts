import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { archiveWeather } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "open-meteo-archive-mcp", version: "1.0.0" })

  server.tool(
    "archive_weather",
    "Daily weather history for a place and date range",
    { latitude: z.number().min(-90).max(90).describe("Latitude"), longitude: z.number().min(-180).max(180).describe("Longitude"), start_date: z.string().describe("Start date, YYYY-MM-DD"), end_date: z.string().describe("End date, YYYY-MM-DD") },
    async ({ latitude, longitude, start_date, end_date }) => {
      try {
        return text(await archiveWeather(latitude, longitude, start_date, end_date))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
