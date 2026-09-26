import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  searchGames,
  getGame,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "mobygames-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_games",
    {
      title: "Search games",
      description: "Title search incl. retro (needs MOBYGAMES_API_KEY).",
      inputSchema: z.object({
        query: z.string().describe("Title text, e.g. Doom."),
        limit: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        return text(await searchGames(query, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_game",
    {
      title: "Get game",
      description: "One game by id, with platforms, genres and score.",
      inputSchema: z.object({
        game_id: z.string().describe("Numeric game ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ game_id }) => {
      try {
        return text(await getGame(game_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}