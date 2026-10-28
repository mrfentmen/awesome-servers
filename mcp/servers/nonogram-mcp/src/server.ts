import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { checkNonogram, cluesFromGrid, solveNonogram, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "nonogram-mcp", version: "1.0.0" })

  server.tool(
    "solve_nonogram",
    "Solve a nonogram from row and column clues and draw the picture.",
    {
      rows: z.array(z.array(z.number().int().min(0))).min(1).max(20).describe("Row clues, e.g. [[3],[1,1]]"),
      cols: z.array(z.array(z.number().int().min(0))).min(1).max(20).describe("Column clues")
    },
    async (a) => {
      try {
        return text(await solveNonogram(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "check_nonogram",
    "Check a filled grid against its clues.",
    {
      grid: z.array(z.string()).min(1).describe("Grid rows using # for filled and . for empty"),
      rows: z.array(z.array(z.number().int().min(0))).describe("Row clues"),
      cols: z.array(z.array(z.number().int().min(0))).describe("Column clues")
    },
    async (a) => {
      try {
        return text(await checkNonogram(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "clues_from_grid",
    "Derive row and column clues from a picture.",
    {
      grid: z.array(z.string()).min(1).describe("Grid rows using # for filled and . for empty")
    },
    async (a) => {
      try {
        return text(await cluesFromGrid(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
