import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  searchBooks,
  getVolume,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "google-books-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_books",
    {
      title: "Search books",
      description: "Google Books volume search.",
      inputSchema: z.object({
        query: z.string().describe("Search text, e.g. Dune Herbert."),
        limit: z.string().describe("Max results (default 10, max 40).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        return text(await searchBooks(query, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_volume",
    {
      title: "Get volume",
      description: "Volume details by ID.",
      inputSchema: z.object({
        volume_id: z.string().describe("Google Books volume ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ volume_id }) => {
      try {
        return text(await getVolume(volume_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}