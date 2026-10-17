import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { app } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "steamspy-mcp", version: "1.0.0" })
  server.registerTool(
    "app",
    {
      title: "App",
      description: "Player statistics for one Steam app.",
      inputSchema: z.object( { appid: z.number().describe("Steam app id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await app(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "genre_apps",
    {
      title: "Genre apps",
      description: "Steam games in a named Steam genre, with developer, estimated owner range and review counts.",
      inputSchema: z.object( { genre: z.string().describe("Steam genre, e.g. \"Early Access\"."), limit: z.number().int().min(1).max(100).default(20).describe("Max results.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement apps locally (paywall removed)
    try { return textError("Not yet implemented: apps") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "top_owned",
    {
      title: "Top owned",
      description: "SteamSpy's most owned games chart, with developer, estimated owner range and review counts.",
      inputSchema: z.object( { limit: z.number().int().min(1).max(100).default(20).describe("Max results.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement owned locally (paywall removed)
    try { return textError("Not yet implemented: owned") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
