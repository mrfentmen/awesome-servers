import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getCocPlayer,
  getCocClan,
  searchCocClans,
  getRoyalePlayer,
  getRoyaleClan,
  getRoyaleTopClans,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const NON_READ_ONLY = { openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "supercell-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_coc_player",
    {
      title: "Get CoC player",
      description: "Clash of Clans player profile: town hall, trophies, troops, achievements, clan.",
      inputSchema: z.object({
        tag: z.string().describe("Player tag with or without '#'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ tag }) => {
      try {
        return text(await getCocPlayer(tag));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_coc_clan",
    {
      title: "Get CoC clan",
      description: "Clash of Clans clan: level, points, war record, member list.",
      inputSchema: z.object({
        tag: z.string().describe("Clan tag with or without '#'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ tag }) => {
      try {
        return text(await getCocClan(tag));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "search_coc_clans",
    {
      title: "Search CoC clans",
      description: "Search Clash of Clans clans by name.",
      inputSchema: z.object({
        name: z.string().describe("Clan name search"),
        limit: z.number().default(5).describe("How many results"),
      }),
      annotations: READ_ONLY,
    },
    async ({ name, limit }) => {
      try {
        return text(await searchCocClans(name, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_royale_player",
    {
      title: "Get Royale player",
      description: "Clash Royale player profile: trophies, wins, cards, current deck, clan.",
      inputSchema: z.object({
        tag: z.string().describe("Player tag with or without '#'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ tag }) => {
      try {
        return text(await getRoyalePlayer(tag));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_royale_clan",
    {
      title: "Get Royale clan",
      description: "Clash Royale clan: score, donations, member list.",
      inputSchema: z.object({
        tag: z.string().describe("Clan tag with or without '#'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ tag }) => {
      try {
        return text(await getRoyaleClan(tag));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_royale_top_clans",
    {
      title: "Get top Royale clans",
      description: "Top Clash Royale clans for a location ranking.",
      inputSchema: z.object({
        locationId: z.string().default("global").describe("Location id, 'global' or numeric"),
        limit: z.number().default(5).describe("How many entries"),
      }),
      annotations: READ_ONLY,
    },
    async ({ locationId, limit }) => {
      try {
        return text(await getRoyaleTopClans(locationId, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
