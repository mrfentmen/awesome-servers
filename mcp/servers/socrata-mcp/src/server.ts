import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { catalog } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "socrata-mcp", version: "1.0.0" })

  server.tool(
    "catalog",
    "Search Socrata open datasets",
    { query: z.string().min(1).describe("Search text"), limit: z.number().int().min(1).max(100).default(10).describe("How many results") },
    async ({ query, limit }) => {
      try {
        return text(await catalog(query, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
