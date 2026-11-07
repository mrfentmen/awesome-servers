import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { searchArtworks } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "art-institute-mcp", version: "1.0.0" })

  server.tool(
    "search_artworks",
    "Search artworks in the collection",
    { query: z.string().min(1).describe("Search text, e.g. monet"), limit: z.number().int().min(1).max(25).default(5).describe("How many artworks") },
    async ({ query, limit }) => {
      try {
        return text(await searchArtworks(query, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
