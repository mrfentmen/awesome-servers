import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { searchPlaces } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "open-meteo-geocoding-mcp", version: "1.0.0" })

  server.tool(
    "search_places",
    "Find places by name",
    { name: z.string().min(1).describe("Place name, e.g. Berlin"), count: z.number().int().min(1).max(20).default(5).describe("How many matches") },
    async ({ name, count }) => {
      try {
        return text(await searchPlaces(name, count))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
