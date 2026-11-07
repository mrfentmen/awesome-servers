import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { getPlayer } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "chess-com-mcp", version: "1.0.0" })

  server.tool(
    "get_player",
    "Profile for a Chess.com player",
    { username: z.string().min(2).describe("Chess.com username, e.g. hikaru") },
    async ({ username }) => {
      try {
        return text(await getPlayer(username))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
