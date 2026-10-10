import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { instance, trends } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "mastodon-mcp", version: "1.0.0" })
  server.registerTool(
    "instance",
    {
      title: "Instance",
      description: "Public info for one instance.",
      inputSchema: z.object( { domain: z.string().describe("Instance domain.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await instance(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "trends",
    {
      title: "Trends",
      description: "Trending tags on one instance.",
      inputSchema: z.object( { domain: z.string().describe("Instance domain.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await trends(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "account_lookup",
    {
      title: "Account lookup",
      description: "Resolve a fediverse handle to the real account behind it on its own instance: type, join date, approval and discoverability flags, follower ratio, profile fields and custom emoji.",
      inputSchema: z.object({ acct: z.string().describe("Handle, e.g. Gargron@mastodon.social or just gargron."), instance: z.string().describe("Instance to assume when the handle has no domain, e.g. hachyderm.io").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: account_lookup ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_mastodon_account_lookup", args)) } catch (e) { return textError(error(e)) }
    }
  )

  server.registerTool(
    "hashtag_timeline",
    {
      title: "Hashtag timeline",
      description: "Read a hashtag timeline on one instance: who is posting under it, which languages, from which servers, how many are replies or boosts, and the post text itself.",
      inputSchema: z.object({ tag: z.string().describe("Hashtag without the #, e.g. opensource."), instance: z.string().describe("Instance domain (default mastodon.social).").optional(), limit: z.number().int().min(1).max(20).default(10).describe("Posts to read (default 10, max 20).") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: hashtag_timeline ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_mastodon_hashtag_timeline", args)) } catch (e) { return textError(error(e)) }
    }
  )

  return server
}
