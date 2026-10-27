import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listFonts,
  searchFonts,
  getFont,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "google-fonts-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_fonts",
    {
      title: "List fonts",
      description: "Most popular Google Fonts families, with categories.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 20, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await listFonts(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "search_fonts",
    {
      title: "Search fonts",
      description: "Families matching a name, e.g. roboto.",
      inputSchema: z.object({
        query: z.string().describe("Name search."),
        limit: z.string().describe("Max results (default 20, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        return text(await searchFonts(query, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_font",
    {
      title: "Get font",
      description: "One family: variants, subsets and font files.",
      inputSchema: z.object({
        family: z.string().describe("Family name, e.g. Roboto.")
      }),
      annotations: READ_ONLY,
    },
    async ({ family }) => {
      try {
        return text(await getFont(family));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}