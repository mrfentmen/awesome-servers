import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  searchPlayers,
  getPlayer,
  getPlayerStats,
  getPlayerHistory,
  searchTeams,
  getChampionships,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const NON_READ_ONLY = { openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "faceit-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_players",
    {
      title: "Search players",
      description: "Search FACEIT players by nickname.",
      inputSchema: z.object({
        nickname: z.string().describe("Nickname search"),
      }),
      annotations: READ_ONLY,
    },
    async ({ nickname }) => {
      try {
        return text(await searchPlayers(nickname));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_player",
    {
      title: "Get player profile",
      description: "FACEIT player profile: id, country, games, skill levels, bans, memberships.",
      inputSchema: z.object({
        playerId: z.string().describe("Player id from search"),
      }),
      annotations: READ_ONLY,
    },
    async ({ playerId }) => {
      try {
        return text(await getPlayer(playerId));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_player_stats",
    {
      title: "Get player stats",
      description: "Lifetime FACEIT stats for a player in one game: matches, wins, K/D, headshots.",
      inputSchema: z.object({
        playerId: z.string().describe("Player id"),
        game: z.string().default("cs2").describe("Game id, e.g. cs2, valorant"),
      }),
      annotations: READ_ONLY,
    },
    async ({ playerId, game }) => {
      try {
        return text(await getPlayerStats(playerId, game));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_player_history",
    {
      title: "Get match history",
      description: "Recent FACEIT matches for a player with scores and maps.",
      inputSchema: z.object({
        playerId: z.string().describe("Player id"),
        game: z.string().default("cs2").describe("Game id"),
        offset: z.number().default(0).describe("Paging offset"),
        limit: z.number().default(5).describe("How many matches"),
      }),
      annotations: READ_ONLY,
    },
    async ({ playerId, game, offset, limit }) => {
      try {
        return text(await getPlayerHistory(playerId, game, offset, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "search_teams",
    {
      title: "Search teams",
      description: "Search FACEIT teams by name.",
      inputSchema: z.object({
        name: z.string().describe("Team name search"),
      }),
      annotations: READ_ONLY,
    },
    async ({ name }) => {
      try {
        return text(await searchTeams(name));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_championships",
    {
      title: "List championships",
      description: "FACEIT championships for a game: prize pools, slots, regions, status.",
      inputSchema: z.object({
        game: z.string().default("cs2").describe("Game id"),
        limit: z.number().default(5).describe("How many entries"),
      }),
      annotations: READ_ONLY,
    },
    async ({ game, limit }) => {
      try {
        return text(await getChampionships(game, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
