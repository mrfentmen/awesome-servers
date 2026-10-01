import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getBooks,
  getBooksByState,
  getBook,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "literal-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_books",
    {
      title: "Get my books",
      description: "Books in your Literal library with authors and covers, newest first.",
      inputSchema: z.object({
        limit: z.number().default(20).describe("How many books"),
        search: z.string().optional().describe("Search within library"),
      }),
      annotations: READ_ONLY,
    },
    async ({ limit, search }) => {
      try {
        return text(await getBooks(limit, search));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_books_by_state",
    {
      title: "Get books by state",
      description: "Your Literal books filtered by reading state.",
      inputSchema: z.object({
        state: z.string().describe("One of IS_READING, WANTS_TO_READ, FINISHED, ABANDONED"),
        limit: z.number().default(20).describe("How many"),
      }),
      annotations: READ_ONLY,
    },
    async ({ state, limit }) => {
      try {
        return text(await getBooksByState(state, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_book",
    {
      title: "Look up book",
      description: "Literal book detail by slug with authors and description.",
      inputSchema: z.object({
        slug: z.string().describe("Book slug"),
      }),
      annotations: READ_ONLY,
    },
    async ({ slug }) => {
      try {
        return text(await getBook(slug));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
