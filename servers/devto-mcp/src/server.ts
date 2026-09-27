import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { articleDetails, latestArticles, podcasts, searchArticles, tagList, topArticles, userArticles, videos } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "devto-mcp", version: "1.0.0" })
  server.registerTool(
    "latest_articles",
    {
      title: "Latest articles",
      description: "The latest articles on dev.to.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await latestArticles(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "search_articles",
    {
      title: "Search articles",
      description: "Search dev.to articles.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await searchArticles(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "article_details",
    {
      title: "Article details",
      description: "Full article with body.",
      inputSchema: z.object( { id: z.number().describe("Article id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await articleDetails(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "user_articles",
    {
      title: "User articles",
      description: "Articles by one username.",
      inputSchema: z.object( { username: z.string().describe("dev.to username."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await userArticles(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "tag_list",
    {
      title: "Tag list",
      description: "Popular tags.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await tagList(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "videos",
    {
      title: "Videos",
      description: "Latest dev videos.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await videos(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "podcasts",
    {
      title: "Podcasts",
      description: "Latest podcast episodes.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await podcasts(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "top_articles",
    {
      title: "Top articles",
      description: "Top articles by period.",
      inputSchema: z.object( { days: z.number().describe("1, 7, 30, 365 or 100000.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await topArticles(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
