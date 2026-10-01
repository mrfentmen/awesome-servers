import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { game, games, studioRanking } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "freetogame-mcp", version: "1.0.0" })
  server.registerTool(
    "games",
    {
      title: "Games",
      description: "List free games with filters.",
      inputSchema: z.object( { platform: z.string().describe("pc, browser, or all.").optional(), category: z.string().describe("Category like shooter or mmorpg.").optional(), sortBy: z.string().describe("relevance or popularity.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await games(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "game",
    {
      title: "Game",
      description: "Details for one game.",
      inputSchema: z.object( { id: z.number().describe("Game ID.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await game(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "genre_platform_matrix",
    {
      title: "Genre platform matrix",
      description: "Cross-tabulate the whole FreeToGame catalogue: how many free games sit in each genre, on which platforms, and across which release years.",
      inputSchema: z.object( { platform: z.string().describe("pc, browser or all.").default("all"), genre: z.string().describe("Substring of the genre, e.g. 'shooter'.").optional(), limit: z.number().int().min(1).max(60).default(20) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: genre_platform_matrix ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_freetogame_genre_platform_matrix", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "studio_ranking",
    {
      title: "Studio ranking",
      description: "Rank developers or publishers by how many free-to-play games they have in the FreeToGame catalogue, with example titles and newest release year.",
      inputSchema: z.object( { role: z.string().describe("developer or publisher.").default("developer"), limit: z.number().int().min(1).max(50).default(20) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await studioRanking(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
