import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { tickers, coin, globalStats, markets } from './api.js'

const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: 'coinlore-mcp', version: '1.0.0' })
  server.registerTool(
    'tickers',
    {
      title: "Tickers",
      description: 'Top coins by market cap.',
      inputSchema: z.object( { limit: z.number().describe('Max results.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await tickers(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    'coin',
    {
      title: "Coin",
      description: 'One coin by id.',
      inputSchema: z.object( { id: z.number().describe('CoinLore id.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await coin(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    'globalStats',
    {
      title: "Global Stats",
      description: 'Global crypto market stats.',
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await globalStats(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    'markets',
    {
      title: "Markets",
      description: 'Markets for a coin id.',
      inputSchema: z.object( { id: z.number().describe('CoinLore id.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await markets(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
