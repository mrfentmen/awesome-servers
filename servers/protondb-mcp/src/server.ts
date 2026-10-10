import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { summary } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "protondb-mcp", version: "1.0.0" })
  server.registerTool(
    "summary",
    {
      title: "Summary",
      description: "Proton compatibility summary for a Steam app.",
      inputSchema: z.object( { appid: z.number().describe("Steam app id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await summary(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "game_details",
    {
      title: "Game details",
      description: "The Steam store record behind a ProtonDB app id: name, developer, release date, platforms, genres and controller support.",
      inputSchema: z.object( { appid: z.number().describe("Steam app id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: game_details ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_protondb_game_details", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "find_app_id",
    {
      title: "Find app id",
      description: "Search the Steam store by game name to find the app id you need for a ProtonDB lookup.",
      inputSchema: z.object( { query: z.string().max(120).describe("Game name."), limit: z.number().int().min(1).max(25).default(10) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: find_app_id ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_protondb_find_app_id", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
