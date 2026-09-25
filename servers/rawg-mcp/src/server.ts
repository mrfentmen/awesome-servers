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
    name: "rawg-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_games",
    {
      title: "Search games",
      description: "Game search (needs RAWG_API_KEY).",
      inputSchema: z.object({
        query: z.string().describe("Game title, e.g. Portal."),
        limit: z.string().describe("Max results (default 10, max 40).").optional()
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
      description: "Game details by ID or slug.",
      inputSchema: z.object({
        game_id: z.string().describe("Numeric ID or slug, e.g. portal / 13536.")
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