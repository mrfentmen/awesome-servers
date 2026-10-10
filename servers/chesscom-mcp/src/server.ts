import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { ChessComError, dailyPuzzle, formatLeaders, formatProfile, formatPuzzle, formatStats, getPlayer, getStats, leaderboards, LEADERBOARD_CATEGORIES, clubProfile } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "chesscom-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_player",
    {
      title: "Get player profile",
      description: "Get a Chess.com player profile: title, name, followers, country, join date, league.",
      inputSchema: z.object({
        username: z.string().describe("Chess.com username, e.g. 'hikaru'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ username }) => {
      try {
        return text(formatProfile(await getPlayer(username)))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_stats",
    {
      title: "Get player ratings",
      description: "Get a Chess.com player's ratings by time control: daily, rapid, blitz, bullet, tactics, Puzzle Rush.",
      inputSchema: z.object({
        username: z.string().describe("Chess.com username, e.g. 'hikaru'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ username }) => {
      try {
        return text(formatStats(username, await getStats(username)))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "daily_puzzle",
    {
      title: "Daily puzzle",
      description: "Get today's Chess.com Daily Puzzle: solve link and board position (FEN).",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        return text(formatPuzzle(await dailyPuzzle()))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "leaderboards",
    {
      title: "Leaderboards",
      description: "Top Chess.com players in a category: daily, rapid, blitz, bullet, or tactics.",
      inputSchema: z.object({
        category: z.enum(LEADERBOARD_CATEGORIES).default("live_blitz"),
        limit: z.number().int().min(1).max(50).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ category, limit }) => {
      try {
        return text(formatLeaders(category, await leaderboards(category, limit)))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "recent_games",
    {
      title: "Recent games",
      description: "Chess.com game archive for a player: rated or casual, time class, ratings, result, timestamps and the game URL.",
      inputSchema: z.object( { username: z.string().describe("chess.com username."), limit: z.number().describe("Max games.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: recent_games ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_chesscom_recent_games", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "club_profile",
    {
      title: "Club profile",
      description: "Chess.com club details: member count, average daily rating, visibility, country, admins and creation date.",
      inputSchema: z.object( { club_id: z.string().describe("Club slug or id, e.g. lichess.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await clubProfile(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "club_members",
    {
      title: "Club members",
      description: "Chess.com club roster for a period, listing member usernames and join dates alongside the weekly, monthly and all-time counts.",
      inputSchema: z.object( { club_id: z.string().describe("Club slug or id, e.g. lichess."), period: z.string().describe("all_time, monthly or weekly.").optional(), limit: z.number().describe("Max members.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: club_members ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_chesscom_club_members", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof ChessComError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
