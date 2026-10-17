import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { brawler, brawlers } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "brawl-stars-mcp", version: "1.0.0" })
  server.registerTool(
    "brawlers",
    {
      title: "Brawlers",
      description: "List all Brawl Stars brawlers.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await brawlers()) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "brawler",
    {
      title: "Brawler",
      description: "Get a single brawler by name.",
      inputSchema: z.object( { name: z.string().describe("Brawler name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await brawler(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "game_maps",
    {
      title: "Game maps",
      description: "Brawl Stars maps with their game mode and environment, active by default, optionally filtered to one mode.",
      inputSchema: z.object( { mode: z.string().describe("Game mode name fragment, e.g. Heist.").optional(), include_disabled: z.boolean().describe("Include retired maps.").optional(), limit: z.number().describe("Max maps.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement maps locally (paywall removed)
    try { return textError("Not yet implemented: maps") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "game_modes",
    {
      title: "Game modes",
      description: "Brawl Stars game modes with team size and description, such as Gem Grab, Heist and Bounty.",
      inputSchema: z.object( { include_disabled: z.boolean().describe("Include retired modes.").optional(), limit: z.number().describe("Max modes.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement modes locally (paywall removed)
    try { return textError("Not yet implemented: modes") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
