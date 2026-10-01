import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getPlayer,
  getMatch,
  getSeasons,
  getLifetimeStats,
  getSeasonStats,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const NON_READ_ONLY = { openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "pubg-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_player",
    {
      title: "Get PUBG player",
      description: "Look up a PUBG player by name: account id plus recent match ids.",
      inputSchema: z.object({
        playerName: z.string().describe("Player name"),
        shard: z.string().default("steam").describe("Shard: steam, psn, xbox, kakao"),
      }),
      annotations: READ_ONLY,
    },
    async ({ playerName, shard }) => {
      try {
        return text(await getPlayer(playerName, shard));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_match",
    {
      title: "Get match data",
      description: "Full PUBG match data: rosters, participants, damage, telemetry asset url.",
      inputSchema: z.object({
        matchId: z.string().describe("Match id"),
        shard: z.string().default("steam").describe("Shard"),
      }),
      annotations: READ_ONLY,
    },
    async ({ matchId, shard }) => {
      try {
        return text(await getMatch(matchId, shard));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_seasons",
    {
      title: "List seasons",
      description: "All PUBG seasons on a shard with ids for stats queries.",
      inputSchema: z.object({
        shard: z.string().default("steam").describe("Shard"),
      }),
      annotations: READ_ONLY,
    },
    async ({ shard }) => {
      try {
        return text(await getSeasons(shard));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_lifetime_stats",
    {
      title: "Get lifetime stats",
      description: "Lifetime PUBG stats for an account across all game modes.",
      inputSchema: z.object({
        accountId: z.string().describe("Account id like 'account.abc'"),
        shard: z.string().default("steam").describe("Shard"),
      }),
      annotations: READ_ONLY,
    },
    async ({ accountId, shard }) => {
      try {
        return text(await getLifetimeStats(accountId, shard));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_season_stats",
    {
      title: "Get season stats",
      description: "One season of PUBG stats for an account: kills, wins, damage per mode.",
      inputSchema: z.object({
        accountId: z.string().describe("Account id"),
        seasonId: z.string().describe("Season id from get_seasons"),
        shard: z.string().default("steam").describe("Shard"),
      }),
      annotations: READ_ONLY,
    },
    async ({ accountId, seasonId, shard }) => {
      try {
        return text(await getSeasonStats(accountId, seasonId, shard));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
