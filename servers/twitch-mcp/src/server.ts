import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  topGames,
  topStreams,
  getUser,
  searchChannels,
} from "./api.js"

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
      description: "Games with the biggest live viewer count right now.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await topGames(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "top_streams",
    {
      title: "Top streams",
      description: "Live streams, optionally for a game.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 10, max 100).").optional(),
        game_id: z.string().describe("Filter by game ID.").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit, game_id }) => {
      try {
        return text(await topStreams(limit, game_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_user",
    {
      title: "Get user",
      description: "Twitch profile for one login name, e.g. shroud.",
      inputSchema: z.object({
        login: z.string().describe("Login name, e.g. shroud.")
      }),
      annotations: READ_ONLY,
    },
    async ({ login }) => {
      try {
        return text(await getUser(login));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "search_channels",
    {
      title: "Search channels",
      description: "Channels matching a query, with live status.",
      inputSchema: z.object({
        query: z.string().describe("Search text."),
        limit: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        return text(await searchChannels(query, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}