import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { address, addressBalance, latestBlock, networkStats, ticker, transaction } from './api.js'

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
      description: 'Bitcoin price in USD, EUR, GBP, JPY and BTC, with buy/sell spreads.',
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try { return text(await ticker()) } catch (e) { return textError(error(e)) }
    }
  )
  server.registerTool(
    'latest_block',
    {
      title: "Latest block",
      description: 'The latest Bitcoin block: height, hash, mining time and transaction count.',
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try { return text(await latestBlock()) } catch (e) { return textError(error(e)) }
    }
  )
  server.registerTool(
    'network_stats',
    {
      title: "Network stats",
      description:
        'Bitcoin network health: hash rate, difficulty, block pace, 24h transaction count, miner revenue and total coins mined.',
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try { return text(await networkStats()) } catch (e) { return textError(error(e)) }
    }
  )
  server.registerTool(
    'address',
    {
      title: "Address",
      description: 'Bitcoin address summary: transaction count, total received/sent, balance and recent transactions.',
      inputSchema: z.object({
        address: z.string().describe('Bitcoin address, legacy or bech32.'),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await address(args)) } catch (e) { return textError(error(e)) }
    }
  )
  server.registerTool(
    'address_balance',
    {
      title: "Address balances",
      description: 'Check the balance of up to 20 Bitcoin addresses at once, comma or space separated.',
      inputSchema: z.object({
        addresses: z.string().describe('Comma-separated Bitcoin addresses (max 20).'),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await addressBalance(args)) } catch (e) { return textError(error(e)) }
    }
  )
  server.registerTool(
    'transaction',
    {
      title: "Transaction",
      description: 'Look up a Bitcoin transaction by hash: size, fee, inputs, outputs and the largest payments.',
      inputSchema: z.object({
        tx_hash: z.string().describe('64-character transaction hash.'),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await transaction(args)) } catch (e) { return textError(error(e)) }
    }
  )
  return server
}
