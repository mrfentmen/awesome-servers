import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { indexPrice, ticker, supported, book, instruments, trades, summary, fundingRateHistory, historicalVolatility, optionsSummary, currencies } from './api.js'
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
      description: 'Deribit index price for one index name, e.g. btc_usd.',
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
      description: 'Ticker for an instrument, e.g. BTC-PERPETUAL.',
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
      description: 'Index names Deribit publishes prices for.',
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await supported(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "book",
    {
      title: "Order book",
      description: "Bids and asks with quantities for an instrument.",
      inputSchema: z.object( { instrument: z.string().describe("Instrument like BTC-PERPETUAL.").optional(), depth: z.number().describe("Book depth each side, 1-20. Defaults to 5.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await book(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "instruments",
    {
      title: "Instruments",
      description: "How many live instruments a currency and kind has, with a 10-name sample. Full list omitted for size.",
      inputSchema: z.object( { currency: z.string().describe("Currency like BTC.").optional(), kind: z.string().describe("future, option or spot. Defaults to future.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await instruments(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "trades",
    {
      title: "Last trades",
      description: "Most recent trades for an instrument as time, direction, amount and price rows.",
      inputSchema: z.object( { instrument: z.string().describe("Instrument like BTC-PERPETUAL.").optional(), count: z.number().describe("How many trades, 1-20. Defaults to 5.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await trades(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "summary",
    {
      title: "Futures summary",
      description: "Per-future last, mark and open interest rows for a currency.",
      inputSchema: z.object( { currency: z.string().describe("Currency like BTC.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await summary(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "funding_rate_history",
    {
      title: "Funding history",
      description: "Perpetual funding rate history with latest, average and annualised rate for an instrument.",
      inputSchema: z.object( { instrument: z.string().describe("Instrument like BTC-PERPETUAL.").optional(), hours: z.number().describe("Hours of history, 8-720. Defaults to 168.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await fundingRateHistory(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "historical_volatility",
    {
      title: "Historical volatility",
      description: "Deribit's historical volatility series for a currency: latest, 7-day average and full range.",
      inputSchema: z.object( { currency: z.string().describe("Currency like BTC.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await historicalVolatility(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "options_summary",
    {
      title: "Options summary",
      description: "Option chain overview: calls vs puts, expiries and the instruments with the most open interest.",
      inputSchema: z.object( { currency: z.string().describe("Currency like BTC.").optional(), limit: z.number().describe("How many top instruments, 1-25. Defaults to 10.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await optionsSummary(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "currencies",
    {
      title: "Currencies",
      description: "Every currency Deribit lists for trading, with the count per coin type.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await currencies(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
