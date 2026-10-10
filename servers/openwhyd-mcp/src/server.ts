import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { hot } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "openwhyd-mcp", version: "1.0.0" })
  server.registerTool(
    "hot",
    {
      title: "Hot",
      description: "Hot tracks on OpenWhyd.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await hot(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "hot_detail",
    {
      title: "Hot detail",
      description: "Hot OpenWhyd tracks with who posted them, which playlist they went into, play and repost counts and a link.",
      inputSchema: z.object( { limit: z.number().int().min(1).max(30).default(10) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: hot_detail ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_openwhyd_hot_detail", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "search_tracks",
    {
      title: "Search tracks",
      description: "Search OpenWhyd for tracks, people and playlists matching a term, with play counts.",
      inputSchema: z.object( { query: z.string().max(120).describe("What to search for."), limit: z.number().int().min(1).max(30).default(10) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: search_tracks ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_openwhyd_search_tracks", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
