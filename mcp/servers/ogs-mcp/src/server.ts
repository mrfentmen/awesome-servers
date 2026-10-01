import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { formatDetails, formatGame, formatPlayer, getPlayer, OgsError, recentGames, searchPlayers, groupList } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "ogs-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_players",
    {
      title: "Search Go players",
      description: "Search Online-Go.com players by username: id, country, overall rating.",
      inputSchema: z.object({
        username: z.string().describe("Username to search, e.g. 'anoek'"),
        limit: z.number().int().min(1).max(20).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ username, limit }) => {
      try {
        const results = await searchPlayers(username, limit)
        if (results.length === 0) return text(`No OGS players match "${username}".`)
        return text(`OGS players for "${username}":\n\n${results.map((p, i) => formatPlayer(p, i)).join("\n")}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_player",
    {
      title: "Get player details",
      description: "Get an Online-Go.com player profile: ratings per category, profile link.",
      inputSchema: z.object({
        id: z.string().describe("Numeric OGS player id, e.g. '1' (use search_players to find it)"),
      }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        const p = await getPlayer(id)
        if (!p) return text(`No OGS player with id ${id}.`)
        return text(formatDetails(p))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "recent_games",
    {
      title: "Recent games",
      description: "Recent games of an Online-Go.com player, with opponents and outcomes.",
      inputSchema: z.object({
        id: z.string().describe("Numeric OGS player id, e.g. '1'"),
        limit: z.number().int().min(1).max(20).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ id, limit }) => {
      try {
        const games = await recentGames(id, limit)
        if (games.length === 0) return text(`No recent games for player ${id}.`)
        return text(`Recent games:\n\n${games.map((g, i) => formatGame(g, i)).join("\n")}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "game_record",
    {
      title: "Game record",
      description: "One Online-Go.com game in full: board size, rules, komi, time control, both ranks and ratings, start and end time.",
      inputSchema: z.object( { game_id: z.string().describe("Numeric OGS game id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: game_record ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_ogs_game_record", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "tournament_list",
    {
      title: "Tournament list",
      description: "Public Online-Go.com tournaments with directors, format and start times.",
      inputSchema: z.object( { limit: z.number().int().min(1).max(20).optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: tournament_list ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_ogs_tournament_list", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "group_list",
    {
      title: "Group list",
      description: "Public Online-Go.com clubs and groups with member counts and visibility.",
      inputSchema: z.object( { limit: z.number().int().min(1).max(20).optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await groupList(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof OgsError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
