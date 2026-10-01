import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { channel, channels } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "somafm-mcp", version: "1.0.0" })
  server.registerTool(
    "channels",
    {
      title: "Channels",
      description: "List channels.",
      inputSchema: z.object( { genre: z.string().describe("Optional genre filter.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await channels(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "channel",
    {
      title: "Channel",
      description: "Get a channel by id.",
      inputSchema: z.object( { id: z.string().describe("Channel id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await channel(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "now_playing",
    {
      title: "Now playing",
      description: "What a SomaFM channel has actually been playing: the most recent tracks with artist, album and air time.",
      inputSchema: z.object( { id: z.string().describe("Channel id, e.g. groovesalad."), limit: z.number().describe("Max tracks.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: now_playing ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_somafm_now_playing", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
