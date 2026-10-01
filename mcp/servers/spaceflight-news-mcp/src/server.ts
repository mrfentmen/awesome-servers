import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { article, articles, reports } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "spaceflight-news-mcp", version: "1.0.0" })
  server.registerTool(
    "articles",
    {
      title: "Articles",
      description: "Latest space news articles.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional(), search: z.string().describe("Optional search terms.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await articles(args)) } catch (e) { return textError(error(e)) }
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
    try { return text(await article(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "blogs",
    {
      title: "Blogs",
      description: "Blog posts from the spaceflight news API, a separate catalogue from the news articles, newest first, with the live catalogue size.",
      inputSchema: z.object( { limit: z.number().describe("How many posts, 1-25. Defaults to 10.").optional(), search: z.string().describe("Optional search text.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: blogs ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_spaceflight_news_blogs", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "reports",
    {
      title: "Reports",
      description: "Reports from the spaceflight news API, its third catalogue, newest first, with the live catalogue size.",
      inputSchema: z.object( { limit: z.number().describe("How many reports, 1-25. Defaults to 10.").optional(), search: z.string().describe("Optional search text.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await reports(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
