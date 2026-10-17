import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { address, addressBalance, latestBlock, networkStats, ticker, transaction, blockByHeight, blockByHash, mempool, feePressure } from "./api.js"
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
      try { return text(await ticker()) } catch (e) { return textError(String(e)) }
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
      try { return text(await latestBlock()) } catch (e) { return textError(String(e)) }
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
      try { return text(await networkStats()) } catch (e) { return textError(String(e)) }
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
      try { return text(await address(args)) } catch (e) { return textError(String(e)) }
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
      try { return text(await addressBalance(args)) } catch (e) { return textError(String(e)) }
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
      try { return text(await transaction(args)) } catch (e) { return textError(String(e)) }
    }
  )
  server.registerTool(
    'block_by_height',
    {
      title: "Block by height",
      description: 'Bitcoin block at a height: hash, mining time, size, weight, total fees and neighbouring blocks.',
      inputSchema: z.object({
        height: z.number().describe('Block height, e.g. 968000.'),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await blockByHeight(args)) } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    'block_by_hash',
    {
      title: "Block by hash",
      description: 'Bitcoin block by its 64-character hash, with the same size, fee and chain fields as block_by_height.',
      inputSchema: z.object({
        hash: z.string().describe('64-character block hash.'),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await blockByHash(args)) } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    'mempool',
    {
      title: "Mempool",
      description: 'Pending Bitcoin transactions: mempool depth plus fees and sizes of the newest waiting transactions.',
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try { return text(await mempool()) } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "coin_supply",
    {
      title: "Coin supply",
      description: "How much Bitcoin is mined against the 21M cap, the halving epoch, the next halving distance and the implied per-block subsidy.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement supply locally (paywall removed)
    try { return textError("Not yet implemented: supply") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "address_timeline",
    {
      title: "Address timeline",
      description: "Lifetime shape of one address: lifetime totals, the most recent transaction window by year and result, fees paid and outgoing value.",
      inputSchema: z.object({
        address: z.string().describe("Bitcoin address"),
        sample: z.number().int().min(10).max(500).default(200).describe("Most recent transactions to analyse, default 200"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement timeline locally (paywall removed)
    try { return textError("Not yet implemented: timeline") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "fee_pressure",
    {
      title: "Fee pressure",
      description: "Unconfirmed-transaction backlog with a sat/byte histogram, percentiles and the share of cheap, normal and priority transactions.",
      inputSchema: z.object({
        buckets: z.number().int().min(4).max(20).default(8).describe("Histogram buckets, default 8"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await feePressure(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
