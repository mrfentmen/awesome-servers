import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { indexPrice, ticker, supported } from './api.js'

const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: 'deribit-mcp', version: '1.0.0' })
  server.registerTool(
    'indexPrice',
    {
      title: "Index Price",
      description: 'Deribit index price.',
      inputSchema: z.object( { index: z.string().describe('Index name, default btc_usd.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await indexPrice(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    'ticker',
    {
      title: "Ticker",
      description: 'Deribit instrument ticker.',
      inputSchema: z.object( { instrument: z.string().describe('Instrument, default BTC-PERPETUAL.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await ticker(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    'supported',
    {
      title: "Supported",
      description: 'List supported index names.',
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await supported(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
