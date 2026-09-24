import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { coin } from "./api.js"
import { coins } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "cryptorank-mcp", version: "1.0.0" })
  server.registerTool(
    "coins",
    {
      title: "Coins",
      description: "List ranked coins.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await coins(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "coin",
    {
      title: "Coin",
      description: "Get a coin by key.",
      inputSchema: z.object( { key: z.string().describe("Coin key like bitcoin.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await coin(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
