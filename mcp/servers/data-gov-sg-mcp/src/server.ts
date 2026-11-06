import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { forecast } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "data-gov-sg-mcp", version: "1.0.0" })

  server.tool(
    "forecast",
    "Two-hour weather forecast for every Singapore area",
    { limit: z.number().int().min(1).max(100).default(15).describe("How many areas") },
    async ({ limit }) => {
      try {
        return text(await forecast(limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
