import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { evaluate } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "mathjs-mcp", version: "1.0.0" })

  server.tool(
    "evaluate",
    "Evaluate a math.js expression",
    { expression: z.string().min(1).describe('Expression, e.g. "2 + 2" or "sqrt(16)') },
    async ({ expression }) => {
      try {
        return text(await evaluate(expression))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
