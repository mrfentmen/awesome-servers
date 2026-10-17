import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { popular, user } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "listenbrainz-mcp", version: "1.0.0" })
  server.registerTool(
    "user",
    {
      title: "User",
      description: "Recent listens for a user.",
      inputSchema: z.object( { username: z.string().describe("ListenBrainz username."), count: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await user(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "popular",
    {
      title: "Popular",
      description: "Top artists for a user.",
      inputSchema: z.object( { username: z.string().describe("ListenBrainz username.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await popular(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "playlists",
    {
      title: "Playlists",
      description: "Public ListenBrainz playlists for a user, with title, creator, date and link.",
      inputSchema: z.object( { username: z.string().describe("ListenBrainz username."), count: z.number().int().min(1).max(50).default(10) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement playlists locally (paywall removed)
    try { return textError("Not yet implemented: playlists") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "top_recordings",
    {
      title: "Top recordings",
      description: "A user's most played tracks for a time range: week, month, year or all_time.",
      inputSchema: z.object( { username: z.string().describe("ListenBrainz username."), range: z.enum(["week", "month", "year", "all_time"]).default("all_time"), count: z.number().int().min(1).max(50).default(10) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement recordings locally (paywall removed)
    try { return textError("Not yet implemented: recordings") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
