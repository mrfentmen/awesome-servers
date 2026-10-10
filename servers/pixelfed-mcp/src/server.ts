import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { instance, publicTimeline } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "pixelfed-mcp", version: "1.0.0" })
  server.registerTool(
    "instance",
    {
      title: "Instance",
      description: "Get Pixelfed instance info.",
      inputSchema: z.object( { instance: z.string().describe("Instance host like pixelfed.social.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await instance(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "public_timeline",
    {
      title: "Public timeline",
      description: "Get public posts.",
      inputSchema: z.object( { instance: z.string().describe("Instance host.").optional(), limit: z.number().describe("Max posts.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await publicTimeline(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "trending_tags",
    {
      title: "Trending tags",
      description: "Trending hashtags on a fediverse server, with the number of posts and accounts using each today.",
      inputSchema: z.object({ instance: z.string().describe("Server host. Defaults to fediscience.org, which serves this endpoint.").optional(), limit: z.number().describe("Max tags, 1-20, default 10.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: trending_tags ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_pixelfed_trending_tags", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "server_rules",
    {
      title: "Server rules",
      description: "The community rules a fediverse server publishes, as text.",
      inputSchema: z.object({ instance: z.string().describe("Server host. Defaults to fediscience.org, which serves this endpoint.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: server_rules ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_pixelfed_server_rules", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "instance_activity",
    {
      title: "Instance activity",
      description: "Weekly post, login and registration counts for a fediverse server.",
      inputSchema: z.object({ instance: z.string().describe("Server host. Defaults to fediscience.org, which serves this endpoint.").optional(), weeks: z.number().describe("Weeks to show, 1-26, default 8.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: instance_activity ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_pixelfed_instance_activity", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
