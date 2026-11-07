import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { searchDatasets } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "data-gov-uk-mcp", version: "1.0.0" })

  server.tool(
    "search_datasets",
    "Search UK government datasets",
    { query: z.string().min(1).describe("Search text, e.g. climate"), limit: z.number().int().min(1).max(50).default(10).describe("How many datasets") },
    async ({ query, limit }) => {
      try {
        return text(await searchDatasets(query, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
