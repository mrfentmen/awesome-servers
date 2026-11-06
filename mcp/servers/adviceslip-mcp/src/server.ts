import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { randomAdvice } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "adviceslip-mcp", version: "1.0.0" })

  server.tool(
    "random_advice",
    "One random piece of advice",
    {  },
    async ({  }) => {
      try {
        return text(await randomAdvice())
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
