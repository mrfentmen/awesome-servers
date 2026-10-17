import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { ticker, board, markets, marketSummary } from "./api.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: 'bitflyer-mcp', version: '1.0.0' })
  server.registerTool(
    'ticker',
    {
      title: "Ticker",
      description: 'BitFlyer ticker for a product.',
      inputSchema: z.object( { product: z.string().describe('Product code, default BTC_JPY.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await ticker(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    'board',
    {
      title: "Board",
      description: 'BitFlyer order book depth.',
      inputSchema: z.object( { product: z.string().describe('Product code, default BTC_JPY.').optional(), depth: z.number().describe('Levels per side.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await board(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    'markets',
    {
      title: "Markets",
      description: 'List BitFlyer spot markets.',
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await markets(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "recent_trades",
    {
      title: "Recent trades",
      description: "The public BitFlyer execution tape for one product, with buy and sell volume, VWAP and an optional minimum trade size.",
      inputSchema: z.object( { product: z.string().describe("Product code, default BTC_JPY.").optional(), count: z.number().describe("How many trades to fetch, 1-500. Defaults to 50.").optional(), minSize: z.number().describe("Only trades of at least this size.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement trades locally (paywall removed)
    try { return textError("Not yet implemented: trades") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "market_summary",
    {
      title: "Market summary",
      description: "One line per BitFlyer spot market with last price, spread in both cash and percent, volume and order book depth imbalance.",
      inputSchema: z.object( {  } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await marketSummary(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "cross_market_check",
    {
      title: "Cross market check",
      description: "Compare each BTC quoted market against its JPY counterpart to see how far the implied price drifts from the quoted one, with the spread that limits it.",
      inputSchema: z.object( {  } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement check locally (paywall removed)
    try { return textError("Not yet implemented: check") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
