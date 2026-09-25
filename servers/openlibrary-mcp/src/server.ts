import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  searchBooks,
  getWork,
  getAuthor,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "openlibrary-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_books",
    {
      title: "Search books",
      description: "Full-text book search with covers and years.",
      inputSchema: z.object({
        query: z.string().describe("Search text, e.g. Dune."),
        limit: z.string().describe("Max results (default 10).").optional()
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
    "get_work",
    {
      title: "Get work",
      description: "Work details by ID (OL123W or /works/OL123W).",
      inputSchema: z.object({
        work_id: z.string().describe("Open Library work ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ work_id }) => {
      try {
        return text(await getWork(work_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_author",
    {
      title: "Get author",
      description: "Author details by ID (OL23919A or /authors/OL23919A).",
      inputSchema: z.object({
        author_id: z.string().describe("Open Library author ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ author_id }) => {
      try {
        return text(await getAuthor(author_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}