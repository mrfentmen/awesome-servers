import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { trade } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "comtrade-mcp", version: "1.0.0" })

  server.tool(
    "trade",
    "Annual trade totals for one reporter country",
    { reporter: z.number().int().describe("Reporter country code, e.g. 842 for USA"), period: z.number().int().min(1962).describe("Year, e.g. 2022") },
    async ({ reporter, period }) => {
      try {
        return text(await trade(reporter, period))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
