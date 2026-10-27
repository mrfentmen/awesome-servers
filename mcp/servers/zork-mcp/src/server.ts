import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { Adventure } from "./engine.js"
import { describeGames, GAMES } from "./games.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

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

  server.tool(
    "list_games",
    "List the text-adventure games available to play.",
    {},
    async () => text(`Available games:\n${describeGames()}`)
  )

  server.tool(
    "start_game",
    "Start (or restart) a text-adventure game. The AI is the player — " +
      "explore with 'look', move with 'go north' etc., take items, and " +
      "collect treasures to win.",
    {
      gameId: z
        .string()
        .default("colossal-dungeon")
        .describe("Game id from list_games (default: colossal-dungeon)"),
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

  server.tool(
    "act",
    "Send a command to the current game: move, look, take, use, examine... " +
      "Returns the game's response.",
    {
      command: z.string().describe(
        "Natural-language command, e.g. 'go north', 'take the lantern', " +
          "'use lantern', 'look', 'inventory'"
      ),
    },
    async ({ command }) => {
      try {
        const game = requireGame()
        return text(game.act(command))
      } catch (e) {
        return text(`Error: ${(e as Error).message}`)
      }
    }
  )

  server.tool(
    "hint",
    "Get a hint for the current room.",
    {},
    async () => {
      try {
        const game = requireGame()
        return text(game.hint())
      } catch (e) {
        return text(`Error: ${(e as Error).message}`)
      }
    }
  )

  server.tool(
    "score",
    "Show your current score, treasures collected, and move count.",
    {},
    async () => {
      try {
        const game = requireGame()
        return text(game.doScore())
      } catch (e) {
        return text(`Error: ${(e as Error).message}`)
      }
    }
  )

  return server
}
