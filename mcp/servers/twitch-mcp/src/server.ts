import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { formatStream, formatUser, getUser, topGames, topStreams, TwitchError, serviceStatus } from "./api.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "twitch-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "top_games",
    {
      title: "Top games",
      description: "Most-watched game categories on Twitch right now.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        const rows = await topGames(limit)
        if (rows.length === 0) return text("No games right now.")
        return text(rows.map((g, i) => `${i + 1}. [${g.id}] ${g.name}`).join("\n"))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "top_streams",
    {
      title: "Top live streams",
      description: "Most-watched live streams, optionally for one game id.",
      inputSchema: z.object({
        game_id: z.string().default("").describe("Game id from top_games, empty = all"),
        limit: z.number().int().min(1).max(100).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ game_id, limit }) => {
      try {
        const rows = await topStreams(game_id, limit)
        if (rows.length === 0) return text("No live streams right now.")
        return text(rows.map((s, i) => formatStream(s, i)).join("\n"))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "get_user",
    {
      title: "Get user",
      description: "A Twitch user: id, display name, broadcaster type, bio.",
      inputSchema: z.object({
        login: z.string().describe("Login name, e.g. 'shroud'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ login }) => {
      try {
        const u = await getUser(login)
        if (!u) return text(`No Twitch user "${login}".`)
        return text(formatUser(u))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "service_status",
    {
      title: "Service status",
      description:
        "Whether Twitch itself is up: the overall indicator, each published component (login, web, chat, watching, broadcasting, purchases) with its state and last update, and any incident still open right now. Reads Twitch's public status page, no client id needed.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async (_args) => {
    try { return text(await serviceStatus()) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "game_demand",
    {
      title: "Game demand",
      description:
        "What is actually being played: Steam's public most-played chart enriched per title with genre, developer, review split, price and owner estimate, plus each game's rank change over a week. The demand side of a streaming decision. No Twitch client id needed.",
      inputSchema: z.object({
        limit: z.number().describe("Games shown, 1-12. Defaults to 6.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement demand locally (paywall removed)
    try { return textError("Not yet implemented: demand") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof TwitchError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
