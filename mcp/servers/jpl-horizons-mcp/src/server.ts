import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { ephemeris } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "jpl-horizons-mcp", version: "1.0.0" })

  server.tool(
    "ephemeris",
    "Position table for a solar system body",
    { target: z.string().default("499").describe("Horizons id, e.g. 499 for Mars, 599 for Jupiter") },
    async ({ target }) => {
      try {
        return text(await ephemeris(target))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
