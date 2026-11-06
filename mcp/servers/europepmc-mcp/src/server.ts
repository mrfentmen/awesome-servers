import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { search } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "europepmc-mcp", version: "1.0.0" })

  server.tool(
    "search",
    "Search Europe PMC biomedical literature: titles, authors, journal, year, citations and ids.",
    {
      query: z.string().min(1).describe('Search terms, e.g. "malaria vaccine" or Europe PMC syntax "TITLE:dengue"'),
      limit: z.number().int().min(1).max(100).default(10).describe("Results per page, 1-100"),
      cursor: z.string().optional().describe("Cursor from a previous result, for the next page"),
    },
    async ({ query, limit, cursor }) => {
      try {
        return text(await search(query, limit, cursor))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
