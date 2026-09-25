import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { browseGames, deals, gameDetails, gamesByIds, searchGames, topRated } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "gog-mcp", version: "1.0.0" })
  server.registerTool(
    "browse_games",
    {
      title: "Browse games",
      description:
        "Browse the GOG catalogue of DRM-free PC games, sorted by trending, newest, biggest discount, cheapest or rating.",
      inputSchema: z.object({
        order: z.enum(["trending", "newest", "discount", "cheapest", "rating"]).describe("Sort order (default trending).").optional(),
        limit: z.number().describe("Max games to show (default 10, max 20).").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await browseGames(args)) } catch (e) { return textError(error(e)) }
    }
  )
  server.registerTool(
    "search_games",
    {
      title: "Search games",
      description: "Search the GOG catalogue by game title and see current prices.",
      inputSchema: z.object({
        query: z.string().describe("Game title, e.g. 'cyberpunk', 'witcher'."),
        limit: z.number().describe("Max games to show (default 10, max 20).").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await searchGames(args)) } catch (e) { return textError(error(e)) }
    }
  )
  server.registerTool(
    "deals",
    {
      title: "Deals",
      description: "Current GOG discounts, filtered to a minimum percentage off.",
      inputSchema: z.object({
        minDiscount: z.number().describe("Minimum discount percent (default 50).").optional(),
        limit: z.number().describe("Max games to show (default 10, max 20).").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await deals(args)) } catch (e) { return textError(error(e)) }
    }
  )
  server.registerTool(
    "top_rated",
    {
      title: "Top rated",
      description: "Highest-rated games on GOG, by user review score.",
      inputSchema: z.object({
        limit: z.number().describe("Max games to show (default 10, max 20).").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await topRated(args)) } catch (e) { return textError(error(e)) }
    }
  )
  server.registerTool(
    "game_details",
    {
      title: "Game details",
      description: "Full details for one GOG product by numeric ID: price, platforms, developer, genres and description.",
      inputSchema: z.object({
        product_id: z.string().describe("GOG product ID as a number, e.g. '1207658924'."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await gameDetails(args)) } catch (e) { return textError(error(e)) }
    }
  )
  server.registerTool(
    "games_by_ids",
    {
      title: "Games by IDs",
      description: "Look up several GOG products at once from a comma-separated list of product IDs.",
      inputSchema: z.object({
        ids: z.string().describe("Comma-separated product IDs, e.g. '1207658695,1207658924'."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await gamesByIds(args)) } catch (e) { return textError(error(e)) }
    }
  )
  return server
}
