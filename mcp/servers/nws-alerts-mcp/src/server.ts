import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { activeAlerts } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "nws-alerts-mcp", version: "1.0.0" })

  server.tool(
    "active_alerts",
    "Active weather alerts for a US state",
    { area: z.string().max(2).default("").describe("Two letter state code, e.g. CA. Empty means all") },
    async ({ area }) => {
      try {
        return text(await activeAlerts(area))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
