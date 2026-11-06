import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { times } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "sunrisesunset-mcp", version: "1.0.0" })

  server.tool(
    "times",
    "Sun times for coordinates on a date",
    { lat: z.number().min(-90).max(90).describe("Latitude, e.g. 51.5072"), lng: z.number().min(-180).max(180).describe("Longitude, e.g. -0.1276"), date: z.string().default("").describe("Date as YYYY-MM-DD, or empty for today") },
    async ({ lat, lng, date }) => {
      try {
        return text(await times(lat, lng, date))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
