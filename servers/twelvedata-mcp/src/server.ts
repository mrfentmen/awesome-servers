import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { quote } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "twelvedata-mcp", version: "1.0.0" })
  server.registerTool(
    "quote",
    {
      title: "Quote",
      description: "Get a stock quote.",
      inputSchema: z.object( { symbol: z.string().describe("Symbol like AAPL.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await quote(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
