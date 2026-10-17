import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { pageQuotes, searchQuotes, pageBacklinks } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "wikiquote-mcp", version: "1.0.0" })
  server.registerTool(
    "search_quotes",
    {
      title: "Search quotes",
      description: "Search Wikiquote pages.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await searchQuotes(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "page_quotes",
    {
      title: "Page quotes",
      description: "Get quotes from a Wikiquote page.",
      inputSchema: z.object( { page: z.string().describe("Page title."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await pageQuotes(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "random_quote_page",
    {
      title: "Random quote page",
      description: "A random Wikiquote page with its short description, last edit time and lead extract.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement page locally (paywall removed)
    try { return textError("Not yet implemented: page") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "page_languages",
    {
      title: "Page languages",
      description: "Which other Wikiquote languages have a page for a given Wikiquote page, with their links.",
      inputSchema: z.object( { page: z.string().describe("Page title."), limit: z.number().int().min(1).max(100).default(20) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement languages locally (paywall removed)
    try { return textError("Not yet implemented: languages") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "page_history",
    {
      title: "Page history",
      description: "Inspect recent revisions of a page, including revision IDs, editors, timestamps and edit summaries.",
      inputSchema: z.object( { title: z.string().describe("Exact page title."), limit: z.number().describe("Maximum results, 1-30.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement history locally (paywall removed)
    try { return textError("Not yet implemented: history") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "backlinks",
    {
      title: "Page backlinks",
      description: "Find pages that link to an exact wiki page.",
      inputSchema: z.object( { title: z.string().describe("Exact target page title."), limit: z.number().describe("Maximum results, 1-30.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await pageBacklinks(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
