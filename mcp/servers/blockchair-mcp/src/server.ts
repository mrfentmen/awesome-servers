import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { stats } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "blockchair-mcp", version: "1.0.0" })

  server.tool(
    "stats",
    "Chain statistics for one blockchain: blocks, transactions, mempool, price, market cap, dominance, hashrate.",
    { chain: z.string().min(2).describe('Chain name, e.g. "bitcoin", "ethereum", "dogecoin", "litecoin"') },
    async ({ chain }) => {
      try {
        return text(await stats(chain))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
