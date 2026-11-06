import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { convert } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "er-api-mcp", version: "1.0.0" })

  server.tool(
    "convert",
    "Convert one currency to another using today's rate",
    { base: z.string().length(3).describe("From currency, e.g. USD"), target: z.string().length(3).describe("To currency, e.g. EUR") },
    async ({ base, target }) => {
      try {
        return text(await convert(base, target))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
