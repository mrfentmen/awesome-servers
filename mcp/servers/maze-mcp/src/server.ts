import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { generateMaze, mazeStats, solveMaze, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "maze-mcp", version: "1.0.0" })

  server.tool(
    "generate_maze",
    "Generate a perfect maze with a seed, ready to print or solve.",
    {
      width: z.number().int().min(5).max(60).describe("Width in cells"),
      height: z.number().int().min(5).max(40).describe("Height in cells"),
      seed: z.number().int().min(0).max(2147483647).default(42).describe("Random seed")
    },
    async (a) => {
      try {
        return text(await generateMaze(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "solve_maze",
    "Solve an ASCII maze from its top-left to bottom-right opening.",
    {
      maze: z.array(z.string()).min(3).describe("Maze rows using # for walls and spaces or . for passages")
    },
    async (a) => {
      try {
        return text(await solveMaze(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "maze_stats",
    "Measure a maze: size, open cells, walls and dead ends.",
    {
      maze: z.array(z.string()).min(3).describe("Maze rows")
    },
    async (a) => {
      try {
        return text(await mazeStats(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
