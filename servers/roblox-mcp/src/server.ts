import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { user } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "roblox-mcp", version: "1.0.0" })
  server.registerTool(
    "user",
    {
      title: "User",
      description: "Roblox user profile.",
      inputSchema: z.object( { id: z.number().describe("User id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await user(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "user_by_name",
    {
      title: "User by name",
      description: "Look a Roblox player up by username to get their numeric id and display name, which the id based lookup cannot do.",
      inputSchema: z.object( { username: z.string().describe("Roblox username."), }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: user_by_name ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_roblox_user_by_name", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "user_games",
    {
      title: "User games",
      description: "The public games a Roblox player has made, with playing and visit counts, which the profile endpoint never shows.",
      inputSchema: z.object( { userId: z.number().describe("Roblox user id."), limit: z.number().describe("Max games.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: user_games ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_roblox_user_games", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "group_info",
    {
      title: "Group info",
      description: "A Roblox group's public record: name, description, owner, member and role counts, which no existing tool returns.",
      inputSchema: z.object( { groupId: z.number().describe("Roblox group id."), }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: group_info ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_roblox_group_info", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
