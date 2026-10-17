import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { agent, agents, maps, weapons, gameModes } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "valorant-mcp", version: "1.0.0" })
  server.registerTool(
    "agents",
    {
      title: "Agents",
      description: "List all agents.",
      inputSchema: z.object( { language: z.string().describe("Language code like en-US.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await agents(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "agent",
    {
      title: "Agent",
      description: "Details for one agent.",
      inputSchema: z.object( { uuid: z.string().describe("Agent UUID."), language: z.string().describe("Language code.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await agent(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "maps",
    {
      title: "Maps",
      description: "List all maps.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await maps(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "weapons",
    {
      title: "Weapons",
      description: "List all weapons.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await weapons(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "map_detail",
    {
      title: "Map detail",
      description: "One Valorant map in full: its layout, splash art, and every location the map data names (callouts, grouped by region).",
      inputSchema: z.object( { map: z.string().describe("Map name or UUID, e.g. 'Ascent' or '7eaecc1b-4337-bbf6-6ab9-04b8f06b3319'.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement detail locally (paywall removed)
    try { return textError("Not yet implemented: detail") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "game_modes",
    {
      title: "Game modes",
      description: "Every Valorant game mode with its description and the rules it is played under (economy, rounds per half, time limit, orbs).",
      inputSchema: z.object( {}),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await gameModes(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
