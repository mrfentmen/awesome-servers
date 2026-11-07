import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { crimesNear } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "uk-police-mcp", version: "1.0.0" })

  server.tool(
    "crimes_near",
    "Crimes reported near a coordinate",
    { latitude: z.number().min(-90).max(90).describe("Latitude"), longitude: z.number().min(-180).max(180).describe("Longitude"), date: z.string().describe("Month, YYYY-MM") },
    async ({ latitude, longitude, date }) => {
      try {
        return text(await crimesNear(latitude, longitude, date))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
