import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { addressInfo } from "./api.js"
import { tokenHistory } from "./api.js"
import { tokenInfo } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "ethplorer-mcp", version: "1.0.0" })
  server.registerTool(
    "token_info",
    {
      title: "Token info",
      description: "Get ERC-20 token details by address.",
      inputSchema: z.object( { address: z.string().describe("Token contract address.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await tokenInfo(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "address_info",
    {
      title: "Address info",
      description: "Get token holdings for an address.",
      inputSchema: z.object( { address: z.string().describe("Wallet address.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await addressInfo(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "token_history",
    {
      title: "Token history",
      description: "Get token transfer history.",
      inputSchema: z.object( { address: z.string().describe("Token address."), limit: z.number().describe("Max records.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await tokenHistory(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
