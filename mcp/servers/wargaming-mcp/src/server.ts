import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  searchWotAccounts,
  getWotAccount,
  getWotTanks,
  searchWotClans,
  searchWowsAccounts,
  getWowsAccount,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const NON_READ_ONLY = { openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "wargaming-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_wot_accounts",
    {
      title: "Search WoT accounts",
      description: "Find World of Tanks accounts by nickname.",
      inputSchema: z.object({
        search: z.string().describe("Nickname search"),
        limit: z.number().default(5).describe("How many results"),
      }),
      annotations: READ_ONLY,
    },
    async ({ search, limit }) => {
      try {
        return text(await searchWotAccounts(search, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_wot_account",
    {
      title: "Get WoT account",
      description: "World of Tanks account details: battles, wins, XP, clan, per-mode stats.",
      inputSchema: z.object({
        accountId: z.string().describe("Account id"),
      }),
      annotations: READ_ONLY,
    },
    async ({ accountId }) => {
      try {
        return text(await getWotAccount(accountId));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_wot_tanks",
    {
      title: "Get WoT tank stats",
      description: "Per-vehicle World of Tanks stats for an account: battles, wins, damage, frags.",
      inputSchema: z.object({
        accountId: z.string().describe("Account id"),
      }),
      annotations: READ_ONLY,
    },
    async ({ accountId }) => {
      try {
        return text(await getWotTanks(accountId));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "search_wot_clans",
    {
      title: "Search WoT clans",
      description: "Find World of Tanks clans by name or tag.",
      inputSchema: z.object({
        search: z.string().describe("Clan search"),
        limit: z.number().default(5).describe("How many results"),
      }),
      annotations: READ_ONLY,
    },
    async ({ search, limit }) => {
      try {
        return text(await searchWotClans(search, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "search_wows_accounts",
    {
      title: "Search WoWS accounts",
      description: "Find World of Warships accounts by nickname.",
      inputSchema: z.object({
        search: z.string().describe("Nickname search"),
        limit: z.number().default(5).describe("How many results"),
      }),
      annotations: READ_ONLY,
    },
    async ({ search, limit }) => {
      try {
        return text(await searchWowsAccounts(search, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_wows_account",
    {
      title: "Get WoWS account",
      description: "World of Warships account details: battles, wins, damage, clan, per-mode stats.",
      inputSchema: z.object({
        accountId: z.string().describe("Account id"),
      }),
      annotations: READ_ONLY,
    },
    async ({ accountId }) => {
      try {
        return text(await getWowsAccount(accountId));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
