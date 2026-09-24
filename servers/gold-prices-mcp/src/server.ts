import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { m0_price, m1_all, m1_price } from './api.js'

const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'gold-prices-mcp', version: '1.0.0' })
server.registerTool(
    "price",
    {
      title: "Price",
      description: "Current price for a metal.",
      inputSchema: z.object( { metal: z.string().describe("XAU gold, XAG silver, XPT platinum, or XPD palladium.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_price(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "all",
    {
      title: "All",
      description: "Prices for all tracked metals.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_all(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
