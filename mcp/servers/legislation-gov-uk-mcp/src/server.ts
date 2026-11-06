import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { act } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "legislation-gov-uk-mcp", version: "1.0.0" })

  server.tool(
    "act",
    "Read a UK Act of Parliament as plain text",
    { kind: z.string().default("ukpga").describe("Act type, e.g. ukpga, asp, anaw"), year: z.number().int().min(1800).max(2100).describe("Year, e.g. 2018"), number: z.number().int().min(1).describe("Act number, e.g. 12") },
    async ({ kind, year, number }) => {
      try {
        return text(await act(kind, year, number))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
