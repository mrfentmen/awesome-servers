import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { ticker, latestBlock, address } from './api.js'

const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: 'blockchain-info-mcp', version: '1.0.0' })
  server.registerTool(
    'ticker',
    {
      title: "Ticker",
      description: 'Bitcoin price across currencies.',
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await ticker(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    'latestBlock',
    {
      title: "Latest Block",
      description: 'Latest Bitcoin block.',
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await latestBlock(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    'address',
    {
      title: "Address",
      description: 'Bitcoin address balance and recent txs.',
      inputSchema: z.object( { address: z.string().describe('Bitcoin address.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await address(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
