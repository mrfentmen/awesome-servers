import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { searchMedia } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "wikimedia-commons-mcp", version: "1.0.0" })

  server.tool(
    "search_media",
    "Search Commons media files",
    { query: z.string().min(1).describe("Search text, e.g. red panda"), limit: z.number().int().min(1).max(50).default(10).describe("How many files") },
    async ({ query, limit }) => {
      try {
        return text(await searchMedia(query, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
