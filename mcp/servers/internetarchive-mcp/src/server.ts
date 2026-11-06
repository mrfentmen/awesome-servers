import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { ArchiveError, item, search } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "internetarchive-mcp", version: "1.0.0" })

  server.tool(
    "search",
    "Search the Internet Archive: books, films, audio, software, images and collections.",
    {
      q: z.string().min(1).describe('Words to look for, e.g. "climate change" or an identifier'),
      limit: z.number().int().min(1).max(100).default(10).describe("Items per page, 1-100"),
      page: z.number().int().min(1).default(1).describe("Page number, starting at 1"),
      mediatype: z
        .string()
        .optional()
        .describe('Optional type filter: "texts", "movies", "audio", "software", "image", "collection", "data"'),
    },
    async ({ q, limit, page, mediatype }) => {
      try {
        return text(await search(q, limit, page, mediatype))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "item",
    "One Internet Archive item by identifier: title, creator, date, media type, file count and description.",
    {
      id: z.string().min(1).describe('Item identifier, e.g. "nasa" or an archive.org/details/... URL'),
    },
    async ({ id }) => {
      try {
        return text(await item(id))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
