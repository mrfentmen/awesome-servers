import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { profile, status } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "minecraft-mojang-mcp", version: "1.0.0" })
  server.registerTool(
    "profile",
    {
      title: "Profile",
      description: "Minecraft profile for a username.",
      inputSchema: z.object( { username: z.string().describe("Minecraft username.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await profile(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "server",
    {
      title: "Server",
      description: "Status for a Minecraft server.",
      inputSchema: z.object( { host: z.string().describe("Server host.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await status(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "latest_version",
    {
      title: "Latest version",
      description: "Latest Minecraft release and snapshot from Mojang's public launcher manifest, plus the most recent releases.",
      inputSchema: z.object( { limit: z.number().int().min(1).max(20).default(5).describe("How many recent releases to list.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement version locally (paywall removed)
    try { return textError("Not yet implemented: version") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "wiki_search",
    {
      title: "Wiki search",
      description: "Search the Minecraft Wiki for pages about an item, block, mob or mechanic, with a short snippet and page id.",
      inputSchema: z.object( { query: z.string().describe("Search term, e.g. diamond or redstone."), limit: z.number().int().min(1).max(20).default(5).describe("Max results.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement search locally (paywall removed)
    try { return textError("Not yet implemented: search") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
