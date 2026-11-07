import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { holidays } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "hebcal-mcp", version: "1.0.0" })

  server.tool(
    "holidays",
    "Jewish holidays for a month",
    { year: z.number().int().min(1900).max(2100).describe("Gregorian year"), month: z.number().int().min(1).max(12).describe("Month, 1 to 12") },
    async ({ year, month }) => {
      try {
        return text(await holidays(year, month))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
