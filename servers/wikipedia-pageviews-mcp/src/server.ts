import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { articleViews, projectAggregate, top, topByAccess } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "wikipedia-pageviews-mcp", version: "1.0.0" })
  server.registerTool(
    "top",
    {
      title: "Top",
      description: "Most viewed Wikipedia pages for a day.",
      inputSchema: z.object( { date: z.string().describe("Date like 2026-08-01.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await top(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "article_views",
    {
      title: "Article views",
      description: "Daily views for one article.",
      inputSchema: z.object( { article: z.string().describe("Article title."), start: z.string().describe("Start like 2026-08-01.").optional(), end: z.string().describe("End like 2026-08-07.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await articleViews(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "project_aggregate",
    {
      title: "Project aggregate",
      description: "Total daily views of English Wikipedia.",
      inputSchema: z.object( { start: z.string().describe("Start like 2026-08-01.").optional(), end: z.string().describe("End like 2026-08-07.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await projectAggregate(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "top_by_access",
    {
      title: "Top by access",
      description: "Top pages for desktop or mobile-app.",
      inputSchema: z.object( { access: z.string().describe("all-access, desktop or mobile-app.").optional(), date: z.string().describe("Date like 2026-08-01.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await topByAccess(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
