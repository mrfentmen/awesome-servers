import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { searchPlanets } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "exoplanet-archive-mcp", version: "1.0.0" })

  server.tool(
    "search_planets",
    "Find exoplanets by name",
    { name: z.string().min(1).describe("Planet or host name, e.g. Kepler"), limit: z.number().int().min(1).max(25).default(5).describe("How many planets") },
    async ({ name, limit }) => {
      try {
        return text(await searchPlanets(name, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
