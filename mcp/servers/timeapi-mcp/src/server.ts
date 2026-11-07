import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { currentTime } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "timeapi-mcp", version: "1.0.0" })

  server.tool(
    "current_time",
    "Current time in a timezone",
    { timezone: z.string().min(3).describe("IANA timezone, e.g. Europe/London") },
    async ({ timezone }) => {
      try {
        return text(await currentTime(timezone))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
