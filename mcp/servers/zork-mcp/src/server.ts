import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { gameMap, gameRoutes } from "./api.js"
import { Adventure } from "./engine.js"
import { describeGames, GAMES } from "./games.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

// A stdio MCP server talks to a single client, so a single in-memory
// game session is the right shape.
let current: Adventure | null = null

function requireGame(): Adventure {
  if (!current) {
    throw new Error(
      "No game in progress. Call start_game first (e.g. 'colossal-dungeon' or 'brainrot-manor')."
    )
  }
  return current
}

export function createServer(): McpServer {
  const server = new McpServer({
    name: "zork-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_games",
    {
      title: "List games",
      description: "List the text-adventure games available to play.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => text(`Available games:\n${describeGames()}`)
  )

  server.registerTool(
    "start_game",
    {
      title: "Start game",
      description: "Start (or restart) a text-adventure game. The AI is the player — " +
      "explore with 'look', move with 'go north' etc., take items, and " +
      "collect treasures to win.",
      inputSchema: z.object(
    {
      gameId: z
        .string()
        .default("colossal-dungeon")
        .describe("Game id from list_games (default: colossal-dungeon)"),
    }),
      annotations: READ_ONLY,
    },
    async ({ gameId }) => {
      const game = GAMES[gameId]
      if (!game) {
        return text(
          `Unknown game "${gameId}". Available: ${Object.keys(GAMES).join(", ")}`
        )
      }
      current = new Adventure(game)
      return text(current.start())
    }
  )

  server.registerTool(
    "act",
    {
      title: "Act",
      description: "Send a command to the current game: move, look, take, use, examine... " +
      "Returns the game's response.",
      inputSchema: z.object(
    {
      command: z.string().describe(
        "Natural-language command, e.g. 'go north', 'take the lantern', " +
          "'use lantern', 'look', 'inventory'"
      ),
    }),
      annotations: READ_ONLY,
    },
    async ({ command }) => {
      try {
        const game = requireGame()
        return text(game.act(command))
      } catch (e) {
        return textError(`Error: ${(e as Error).message}`)
      }
    }
  )

  server.registerTool(
    "hint",
    {
      title: "Hint",
      description: "Get a hint for the current room.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const game = requireGame()
        return text(game.hint())
      } catch (e) {
        return textError(`Error: ${(e as Error).message}`)
      }
    }
  )

  server.registerTool(
    "score",
    {
      title: "Score",
      description: "Show your current score, treasures collected, and move count.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const game = requireGame()
        return text(game.doScore())
      } catch (e) {
        return textError(`Error: ${(e as Error).message}`)
      }
    }
  )

  server.registerTool(
    "game_map",
    {
      title: "Game map",
      description: "Show every room of a bundled game with its objects and its exits, including which exits are locked, unlit or one way. Read straight from the engine's own map, no network.",
      inputSchema: z.object( { gameId: z.string().describe("Game id from list_games, default colossal-dungeon.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try {
        return text(await gameMap(args))
      } catch (e) {
        return textError(`Error: ${(e as Error).message}`)
      }
    }
  )

  server.registerTool(
    "game_routes",
    {
      title: "Game routes",
      description: "Shortest route from a room to every other room in a game, worked out with a breadth-first walk of the declared exits, with dark rooms and guarded exits flagged.",
      inputSchema: z.object( {
        gameId: z.string().describe("Game id from list_games, default colossal-dungeon.").optional(),
        from: z.string().describe("Room id to start from, default the game's start room.").optional(),
        maxRooms: z.number().int().min(1).max(200).describe("Max rooms listed, 1-200, default 30.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: game_routes ----
      const paywallMessage = await premiumRequired("game_routes")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try {
        return text(await gameRoutes(args))
      } catch (e) {
        return textError(`Error: ${(e as Error).message}`)
      }
    }
  )

  return server
}
