import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getPlayer,
  getPlayerByUid,
  getMapRotation,
  getCraftingRotation,
  getPredatorCounts,
  getServerStatus,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const NON_READ_ONLY = { openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "apexlegends-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_player",
    {
      title: "Get player stats",
      description: "Apex Legends player stats by name: level, rank, kills, favorite legend.",
      inputSchema: z.object({
        player: z.string().describe("Player name"),
        platform: z.string().default("PC").describe("PC, PS4 or X1"),
      }),
      annotations: READ_ONLY,
    },
    async ({ player, platform }) => {
      try {
        return text(await getPlayer(player, platform));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_player_by_uid",
    {
      title: "Get player by uid",
      description: "Apex Legends player stats by platform uid instead of name.",
      inputSchema: z.object({
        uid: z.string().describe("Platform uid"),
        platform: z.string().default("PC").describe("PC, PS4 or X1"),
      }),
      annotations: READ_ONLY,
    },
    async ({ uid, platform }) => {
      try {
        return text(await getPlayerByUid(uid, platform));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_map_rotation",
    {
      title: "Get map rotation",
      description: "Current and next Apex Legends map rotation for battle royale, ranked and mixtape.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getMapRotation());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_crafting_rotation",
    {
      title: "Get crafting rotation",
      description: "Current Apex Legends replicator crafting rotation: daily and weekly items.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getCraftingRotation());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_predator_counts",
    {
      title: "Get predator counts",
      description: "Apex Predator badge counts per platform plus minimum RP thresholds.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getPredatorCounts());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_server_status",
    {
      title: "Get server status",
      description: "Apex Legends server status per region: online, slow or down with response times.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getServerStatus());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
