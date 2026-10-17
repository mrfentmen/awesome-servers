import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { hnItem, hnTop, redditTop, hnComments } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "hn-reddit-mcp", version: "1.0.0" })
  server.registerTool(
    "get_hn_top",
    {
      title: "Get hn top",
      description: "Get top Hacker News stories.",
      inputSchema: z.object( { limit: z.number().describe("Max stories.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await hnTop(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "get_hn_item",
    {
      title: "Get hn item",
      description: "Get one Hacker News item by id.",
      inputSchema: z.object( { item_id: z.number().describe("Hacker News item id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await hnItem(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "get_reddit_top",
    {
      title: "Get reddit top",
      description: "Get top posts from a subreddit.",
      inputSchema: z.object( { subreddit: z.string().describe("Subreddit name without the r slash."), limit: z.number().describe("Max posts.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await redditTop(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "hn_search",
    {
      title: "HN search",
      description: "Full-text search Hacker News through the Algolia index: match title, points, comment count, author and date, with an optional minimum score.",
      inputSchema: z.object({ query: z.string().min(1).max(200), tag: z.string().default("story").describe("story, comment, poll, show_hn, ask_hn or front_page"), minPoints: z.number().int().min(0).default(0), hitsPerPage: z.number().int().min(1).max(30).default(10), page: z.number().int().min(0).max(50).default(0) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement search locally (paywall removed)
    try { return textError("Not yet implemented: search") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "hn_comments",
    {
      title: "HN comments",
      description: "The comment tree under one Hacker News story, with each comment's author, indented by reply depth.",
      inputSchema: z.object({ id: z.number().int().min(1), depth: z.number().int().min(1).max(6).default(2) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await hnComments(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "reddit_search",
    {
      title: "Reddit search",
      description: "Search one subreddit's posts by keyword over the last year via Reddit's Atom feed, with the poster and permalink.",
      inputSchema: z.object({ subreddit: z.string().min(1).max(60), query: z.string().min(1).max(200), limit: z.number().int().min(1).max(25).default(10) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement search locally (paywall removed)
    try { return textError("Not yet implemented: search") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
