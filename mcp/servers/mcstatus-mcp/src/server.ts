import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { status, playerProfile } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "mcstatus-mcp", version: "1.0.0" })
  server.registerTool(
    "status",
    {
      title: "Status",
      description: "Get Minecraft server status.",
      inputSchema: z.object( { host: z.string().describe("Server host or IP."), port: z.number().describe("Server port.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await status(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "latest_versions",
    {
      title: "Latest versions",
      description: "Latest Minecraft Java releases and snapshots from the official Mojang version manifest, with release dates.",
      inputSchema: z.object( { kind: z.string().describe("release, snapshot or both.").optional(), limit: z.number().describe("Max versions.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement versions locally (paywall removed)
    try { return textError("Not yet implemented: versions") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "player_profile",
    {
      title: "Player profile",
      description: "Resolve a Minecraft username to its account UUID using the official Mojang profile API.",
      inputSchema: z.object( { name: z.string().describe("Minecraft username.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await playerProfile(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
