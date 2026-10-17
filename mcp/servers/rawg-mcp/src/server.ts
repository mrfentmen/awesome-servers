import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { errorMessage, searchGames, getGame } from "./api.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "rawg-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_games",
    {
      title: "Search games",
      description: "Game search (needs RAWG_API_KEY).",
      inputSchema: z.object({
        query: z.string().describe("Game title, e.g. Portal."),
        limit: z.string().describe("Max results (default 10, max 40).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        return text(await searchGames(query, limit));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "get_game",
    {
      title: "Get game",
      description: "One game by id or slug, with platforms and rating.",
      inputSchema: z.object({
        game_id: z.string().describe("Numeric ID or slug, e.g. portal / 13536.")
      }),
      annotations: READ_ONLY,
    },
    async ({ game_id }) => {
      try {
        return text(await getGame(game_id));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "steam_store_info",
    {
      title: "Steam store record",
      description:
        "The Steam store's own record for an app: type, developer, publisher, release date, platforms, genres, feature tags, price, review count, content notes and achievement count.",
      inputSchema: z.object({
        app_id: z.number().describe("Steam app id, the number in store.steampowered.com/app/<id>/, e.g. 730"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement info locally (paywall removed)
    try { return textError("Not yet implemented: info") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "steam_reach",
    {
      title: "Steam reach",
      description:
        "How big a Steam title actually is: the estimated ownership bracket, players online right now, the positive and negative review split, median playtime and the community tags.",
      inputSchema: z.object({
        app_id: z.number().describe("Steam app id, e.g. 730"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement reach locally (paywall removed)
    try { return textError("Not yet implemented: reach") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}