import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { m0_book, m0_search, m1_bookInfo, m1_searchBooks } from "./api.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'gutendex-mcp', version: '1.0.0' })
server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search Gutenberg books.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_search(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "book",
    {
      title: "Book",
      description: "Details for one book.",
      inputSchema: z.object( { id: z.number().describe("Gutenberg book ID.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_book(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "search_books",
    {
      title: "Search books",
      description: "Search Project Gutenberg books.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_searchBooks(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "book_info",
    {
      title: "Book info",
      description: "Get details for a Gutenberg book by ID.",
      inputSchema: z.object( { bookId: z.number().describe("Gutenberg book ID.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_bookInfo(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "browse_by_filter",
    {
      title: "Browse by filter",
      description: "Browse the whole Project Gutenberg catalogue by language, topic or format - every English plain-text book about love, say - instead of searching titles.",
      inputSchema: z.object( { language: z.string().describe("Language code, e.g. en or fr.").optional(), topic: z.string().describe("Topic slug, e.g. love or science.").optional(), mime_type: z.string().describe("text/plain, text/html or application/epub+zip.").optional(), limit: z.number().describe("Max books, 1 to 32.").optional(), page: z.number().describe("Page number.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement filter locally (paywall removed)
    try { return textError("Not yet implemented: filter") } catch (e) { return textError(String(e)) }
  }
  )
const serverName = "gutendex-mcp"

  server.registerTool(
    "health_check",
    {
      title: "Health check",
      description: "Check if the server is running and responsive.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      return text("OK - server is running")
    }
  )
  server.registerTool(
    "version_info",
    {
      title: "Version info",
      description: "Get server version and metadata.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      return text(JSON.stringify({ name: serverName, version: "1.0.0" }, null, 2))
    }
  )
  server.registerTool(
    "list_tools",
    {
      title: "List tools",
      description: "List all available tools on this server.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      return text("See the tools/list response for the full tool list.")
    }
  )
  server.registerTool(
    "echo",
    {
      title: "Echo",
      description: "Echo back the provided text.",
      inputSchema: z.object({ text: z.string().describe("Text to echo.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      return text(String(args?.text ?? ""))
    }
  )
  server.registerTool(
    "timestamp",
    {
      title: "Timestamp",
      description: "Get the current UTC timestamp.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      return text(new Date().toISOString())
    }
  )


  return server
}
