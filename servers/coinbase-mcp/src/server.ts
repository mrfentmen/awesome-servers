import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { exchange } from "./api.js"
import { spot } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "coinbase-mcp", version: "1.0.0" })
  server.registerTool(
    "spot",
    {
      title: "Spot",
      description: "Spot price for a pair.",
      inputSchema: z.object( { pair: z.string().describe("Pair like BTC-USD.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await spot(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "exchange",
    {
      title: "Exchange",
      description: "Exchange rates.",
      inputSchema: z.object( { currency: z.string().describe("Base currency like USD.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await exchange(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
