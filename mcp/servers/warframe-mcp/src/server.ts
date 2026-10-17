import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { state, nightwave, dailyDeals } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "warframe-mcp", version: "1.0.0" })
  server.registerTool(
    "state",
    {
      title: "State",
      description: "Current game state.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await state(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "invasions",
    {
      title: "Invasions",
      description: "Ongoing Grineer and Corpus invasions with node, defender and attacker rewards.",
      inputSchema: z.object( { limit: z.number().describe("Max invasions.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement invasions locally (paywall removed)
    try { return textError("Not yet implemented: invasions") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "nightwave",
    {
      title: "Nightwave",
      description: "Current Nightwave season and its active challenges with reputation rewards.",
      inputSchema: z.object( { limit: z.number().describe("Max challenges.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await nightwave(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "sortie",
    {
      title: "Sortie",
      description: "Current Warframe sortie boss, faction and three mission modifiers.",
      inputSchema: z.object( {} ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement sortie locally (paywall removed)
    try { return textError("Not yet implemented: sortie") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "archon_hunt",
    {
      title: "Archon hunt",
      description: "Current Warframe Archon hunt boss and mission sequence.",
      inputSchema: z.object( {} ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement hunt locally (paywall removed)
    try { return textError("Not yet implemented: hunt") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "daily_deals",
    {
      title: "Daily deals",
      description: "Current Warframe Darvo daily deals with prices, discount and stock.",
      inputSchema: z.object( { limit: z.number().int().min(1).max(25).optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await dailyDeals(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
