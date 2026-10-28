import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { pageDetail, searchPages, searchTitles, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "chronam-mcp", version: "1.0.0" })

  server.tool(
    "search_pages",
    "Search digitised newspaper pages by keyword, optionally limited to a state or a year range.",
    {
      query: z.string().min(2).describe('Words to find, e.g. "tesla wireless"'),
      state: z.string().min(2).optional().describe('US state filter, e.g. "rhode island"'),
      yearStart: z.number().int().min(1690).max(1963).optional().describe("Earliest year"),
      yearEnd: z.number().int().min(1690).max(1963).optional().describe("Latest year"),
      limit: z.number().int().min(1).max(25).default(10).describe("Pages to return")
    },
    async (a) => {
      try {
        return text(await searchPages(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "page_detail",
    "Details for one newspaper page by its loc.gov resource id.",
    {
      id: z.string().min(6).describe('Page id from search_pages, e.g. "sn83016025/1896-05-09/ed-1/?sp=11"')
    },
    async (a) => {
      try {
        return text(await pageDetail(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_titles",
    "Find newspaper titles in the collection, with place of publication.",
    {
      query: z.string().min(2).describe('Title words, e.g. "daily press"'),
      limit: z.number().int().min(1).max(25).default(10).describe("Titles to return")
    },
    async (a) => {
      try {
        return text(await searchTitles(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
