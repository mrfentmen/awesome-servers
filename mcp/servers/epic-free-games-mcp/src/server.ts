import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { freeGames, promoSummary } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "epic-free-games-mcp", version: "1.0.0" })
  server.registerTool(
    "free_games",
    {
      title: "Free games",
      description: "List games currently free on Epic.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await freeGames(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "upcoming_games",
    {
      title: "Upcoming games",
      description: "What Epic is giving away next, with the real start and end dates and the normal price, read from the upcoming offers the free_games tool ignores.",
      inputSchema: z.object( { limit: z.number().describe("How many scheduled titles to show, 1-20. Defaults to 10.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement games locally (paywall removed)
    try { return textError("Not yet implemented: games") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "promo_summary",
    {
      title: "Promotion summary",
      description: "The whole Epic giveaway run totalled up: how many titles are free now, how many are scheduled, what they are worth at normal price and when the next offer ends.",
      inputSchema: z.object( {  } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await promoSummary()) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
