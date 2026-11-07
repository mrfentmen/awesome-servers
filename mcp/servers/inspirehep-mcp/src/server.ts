import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { searchLiterature } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "inspirehep-mcp", version: "1.0.0" })

  server.tool(
    "search_literature",
    "Search physics literature",
    { query: z.string().min(1).describe("Search text or INSPIRE query"), limit: z.number().int().min(1).max(25).default(5).describe("How many papers") },
    async ({ query, limit }) => {
      try {
        return text(await searchLiterature(query, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
