import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { generate, solve } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "sudoku-mcp", version: "1.0.0" })
  server.registerTool(
    "generate",
    {
      title: "Generate",
      description: "Generate a Sudoku puzzle with a difficulty.",
      inputSchema: z.object( { difficulty: z.string().describe("easy, medium, hard, or expert.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await generate(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "solve",
    {
      title: "Solve",
      description: "Solve a Sudoku puzzle.",
      inputSchema: z.object( { grid: z.string().describe("81 digits, 0 for empty cells.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await solve(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "hint",
    {
      title: "Hint",
      description: "Solve a Sudoku and return just the value for the first empty cell, one nudge at a time.",
      inputSchema: z.object( { grid: z.string().describe("81 digits, 0 or . for empty cells.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement hint locally (paywall removed)
    try { return textError("Not yet implemented: hint") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "validate",
    {
      title: "Validate",
      description: "Check a partial Sudoku for duplicate digits in rows, columns and boxes, and say whether it has a unique solution.",
      inputSchema: z.object( { grid: z.string().describe("81 digits, 0 or . for empty cells.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement validate locally (paywall removed)
    try { return textError("Not yet implemented: validate") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
