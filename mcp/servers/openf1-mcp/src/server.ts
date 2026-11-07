import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { sessionDrivers } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "openf1-mcp", version: "1.0.0" })

  server.tool(
    "session_drivers",
    "Drivers in the latest Formula 1 session",
    {  },
    async ({  }) => {
      try {
        return text(await sessionDrivers())
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
