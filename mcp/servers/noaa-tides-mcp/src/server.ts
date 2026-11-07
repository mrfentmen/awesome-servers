import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { waterLevel } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "noaa-tides-mcp", version: "1.0.0" })

  server.tool(
    "water_level",
    "Latest water level at a tide station",
    { station: z.string().min(7).max(7).describe("Seven digit station id, e.g. 8454000"), units: z.enum(["english", "metric"]).default("english").describe("Units") },
    async ({ station, units }) => {
      try {
        return text(await waterLevel(station, units))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
