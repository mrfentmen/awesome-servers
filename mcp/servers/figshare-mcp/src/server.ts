import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { article, search, articleVersionHistory } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "figshare-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search Figshare articles.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "article",
    {
      title: "Article",
      description: "One article by ID.",
      inputSchema: z.object( { id: z.number().describe("Article ID.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await article(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "article_version_history",
    {
      title: "Article version history",
      description: "Every published version of a Figshare article, with version number and the api url for each version.",
      inputSchema: z.object( { id: z.number().int().describe("Figshare article id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await articleVersionHistory(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "recent_articles",
    {
      title: "Recent articles",
      description: "The most recently published or modified public Figshare articles, ordered by a chosen date field, with id, doi and public url.",
      inputSchema: z.object( { limit: z.number().int().min(1).max(50).default(10), order: z.string().default("published_date").describe("published_date, modified_date, created_date or views") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement articles locally (paywall removed)
    try { return textError("Not yet implemented: articles") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
