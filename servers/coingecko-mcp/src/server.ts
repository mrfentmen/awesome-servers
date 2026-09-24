import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { m0_price, m0_trending } from './api.js'

const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'coingecko-mcp', version: '1.0.0' })
server.registerTool(
    "price",
    {
      title: "Price",
      description: "Price for one coin.",
      inputSchema: z.object( { coin: z.string().describe("Coin id like bitcoin."), currency: z.string().describe("Currency like usd.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_price(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "trending",
    {
      title: "Trending",
      description: "Trending coins.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_trending(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
