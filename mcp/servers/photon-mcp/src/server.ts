import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { geocode } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "photon-mcp", version: "1.0.0" })

  server.tool(
    "geocode",
    "Find places with OpenStreetMap data: name, street, city, region, country and coordinates.",
    {
      q: z.string().min(1).describe('Place to look for, e.g. "Paris" or "Alexanderplatz Berlin"'),
      limit: z.number().int().min(1).max(50).default(5).describe("How many places to return"),
      lang: z.string().length(2).optional().describe('Optional two-letter language, e.g. "de" or "fr"'),
    },
    async ({ q, limit, lang }) => {
      try {
        return text(await geocode(q, limit, lang))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
