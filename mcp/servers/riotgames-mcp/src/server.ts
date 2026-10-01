import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getAccountByRiotId,
  getLolSummoner,
  getLolMatchIds,
  getLolMatch,
  getLolChampionMastery,
  getDdragonVersions,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const NON_READ_ONLY = { openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "riotgames-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_account_by_riot_id",
    {
      title: "Get account by Riot ID",
      description: "Resolve a Riot ID (gameName + tagLine) to PUUID and region info. Works for LoL, Valorant, TFT.",
      inputSchema: z.object({
        gameName: z.string().describe("Riot ID game name, e.g. 'Faker'"),
        tagLine: z.string().describe("Riot ID tag, e.g. 'KR1'"),
        cluster: z.string().default("americas").describe("Routing cluster: americas, asia, europe or sea"),
      }),
      annotations: READ_ONLY,
    },
    async ({ gameName, tagLine, cluster }) => {
      try {
        return text(await getAccountByRiotId(gameName, tagLine, cluster));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_lol_summoner",
    {
      title: "Get LoL summoner",
      description: "Get a League of Legends summoner profile by PUUID: level, profile icon, revision date.",
      inputSchema: z.object({
        puuid: z.string().describe("Player PUUID from get_account_by_riot_id"),
        platform: z.string().default("na1").describe("Platform routing: na1, euw1, kr, ..."),
      }),
      annotations: READ_ONLY,
    },
    async ({ puuid, platform }) => {
      try {
        return text(await getLolSummoner(puuid, platform));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_lol_match_ids",
    {
      title: "List LoL match ids",
      description: "List recent League of Legends match ids for a PUUID, newest first.",
      inputSchema: z.object({
        puuid: z.string().describe("Player PUUID"),
        cluster: z.string().default("americas").describe("Routing cluster"),
        count: z.number().default(5).describe("How many ids (1-100)"),
      }),
      annotations: READ_ONLY,
    },
    async ({ puuid, cluster, count }) => {
      try {
        return text(await getLolMatchIds(puuid, cluster, count));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_lol_match",
    {
      title: "Get LoL match detail",
      description: "Full detail for one LoL match: teams, participants, builds, damage, objectives.",
      inputSchema: z.object({
        matchId: z.string().describe("Match id like NA1_539 etc. Use ids from get_lol_match_ids."),
        cluster: z.string().default("americas").describe("Routing cluster"),
      }),
      annotations: READ_ONLY,
    },
    async ({ matchId, cluster }) => {
      try {
        return text(await getLolMatch(matchId, cluster));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_lol_champion_mastery",
    {
      title: "Top champion mastery",
      description: "Top champion-mastery entries for a summoner: champion ids, points, chest granted.",
      inputSchema: z.object({
        puuid: z.string().describe("Player PUUID"),
        platform: z.string().default("na1").describe("Platform routing"),
        count: z.number().default(5).describe("How many entries"),
      }),
      annotations: READ_ONLY,
    },
    async ({ puuid, platform, count }) => {
      try {
        return text(await getLolChampionMastery(puuid, platform, count));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_ddragon_versions",
    {
      title: "List Data Dragon versions",
      description: "Keyless: list all League of Legends Data Dragon patch versions, newest first.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getDdragonVersions());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
