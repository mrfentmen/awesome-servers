import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { errorMessage, searchGames, getGame } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "mobygames-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_games",
    {
      title: "Search games",
      description: "Title search incl. retro (needs MOBYGAMES_API_KEY).",
      inputSchema: z.object({
        query: z.string().describe("Title text, e.g. Doom."),
        limit: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        return text(await searchGames(query, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_game",
    {
      title: "Get game",
      description: "One game by id, with platforms, genres and score.",
      inputSchema: z.object({
        game_id: z.string().describe("Numeric game ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ game_id }) => {
      try {
        return text(await getGame(game_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "steam_game_profile",
    {
      title: "Steam game profile",
      description: "One game's store profile from Valve's public app details: developers, publishers, genres, release date, platforms, price and discount, review recommendations, Metacritic score, achievement count and highlighted achievements, categories and languages.",
      inputSchema: z.object({ appid: z.number().int().positive().describe("Steam app id, e.g. 400 for Portal."), limit: z.number().int().min(1).max(20).default(8).describe("Highlighted achievements to print (default 8, max 20).") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: steam_game_profile ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_mobygames_steam_game_profile", args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "steam_specials_census",
    {
      title: "Steam specials census",
      description: "What is on special in the Steam store right now, ranked by depth of discount, with the median discount, how many titles sit in each discount band, and each title's current US price.",
      inputSchema: z.object({ limit: z.number().int().min(1).max(40).default(10).describe("Specials to print (default 10, max 40).") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: steam_specials_census ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_mobygames_steam_specials_census", args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  return server
}