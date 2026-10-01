import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { search, actorPosts } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "bluesky-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search Bluesky actors.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "actor_posts",
    {
      title: "Actor posts",
      description: "Recent posts from a Bluesky handle or DID, with reply, like, repost and quote counts.",
      inputSchema: z.object( { actor: z.string().describe("Handle or DID, e.g. bsky.app."), limit: z.number().describe("Max posts.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await actorPosts(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "post_thread",
    {
      title: "Post thread",
      description: "One Bluesky post with its parent and nested replies walked to a chosen depth.",
      inputSchema: z.object( { uri: z.string().describe("Post at-uri."), depth: z.number().describe("How many reply levels, 1 to 10.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: post_thread ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_bluesky_post_thread", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "post_quotes",
    {
      title: "Post quotes",
      description: "Posts that quote a given Bluesky post, newest first.",
      inputSchema: z.object( { uri: z.string().describe("Post at-uri."), limit: z.number().describe("Max quotes.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: post_quotes ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_bluesky_post_quotes", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
