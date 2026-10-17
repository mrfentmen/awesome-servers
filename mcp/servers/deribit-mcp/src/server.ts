import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { indexPrice, ticker, supported, book, instruments, trades, summary, fundingRateHistory, historicalVolatility, optionsSummary, currencies, optionsPositioning } from "./api.js"
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
    try { return text(await indexPrice(args)) } catch (e) { return textError(String(e)) }
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
    try { return text(await ticker(args)) } catch (e) { return textError(String(e)) }
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
    try { return text(await supported(args)) } catch (e) { return textError(String(e)) }
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
    try { return text(await book(args)) } catch (e) { return textError(String(e)) }
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
    try { return text(await instruments(args)) } catch (e) { return textError(String(e)) }
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
    try { return text(await trades(args)) } catch (e) { return textError(String(e)) }
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
    try { return text(await summary(args)) } catch (e) { return textError(String(e)) }
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
    try { return text(await fundingRateHistory(args)) } catch (e) { return textError(String(e)) }
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
    try { return text(await historicalVolatility(args)) } catch (e) { return textError(String(e)) }
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
    try { return text(await optionsSummary(args)) } catch (e) { return textError(String(e)) }
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
    try { return text(await currencies(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "futures_open_interest",
    {
      title: "Futures open interest",
      description: "Open interest across every future and perpetual on a currency, ranked, with each instrument's 24 hour range, mark-versus-index basis and volume-to-open-interest turnover. The existing options tool covers options only, so this is the same view for the futures book, and flags instruments paying negative funding.",
      inputSchema: z.object({
        currency: z.string().describe("Currency, for example BTC or ETH."),
        kind: z.string().default("future").describe("future, option, future_combo or option_combo, default future"),
        limit: z.number().int().min(1).max(60).default(12).describe("Instruments to list, default 12"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement interest locally (paywall removed)
    try { return textError("Not yet implemented: interest") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "implied_vol_history",
    {
      title: "DVOL implied volatility history",
      description: "The Deribit DVOL implied volatility index over a chosen window, with the period change, average, range and a trend line, and the one-sigma daily and weekly move the index implies. This is the options market's own price of risk, which is a different series from the realised volatility the existing tool reports.",
      inputSchema: z.object({
        currency: z.string().describe("Currency, for example BTC or ETH."),
        period: z.string().default("7d").describe("1d, 7d, 30d, 90d or 1y, default 7d. Resolution and range are chosen automatically."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement history locally (paywall removed)
    try { return textError("Not yet implemented: history") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "options_positioning",
    {
      title: "Options positioning",
      description: "Where option open interest sits on Deribit: the put-call open interest ratio and what it usually means, open interest by expiry, a max-pain estimate from the strike where the most open interest expires worthless, and the largest single positions with their moneyness. Distinct from the options summary tool, which lists instruments.",
      inputSchema: z.object({
        currency: z.string().describe("Currency, for example BTC or ETH."),
        limit: z.number().int().min(1).max(30).default(8).describe("Largest positions to list, default 8"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await optionsPositioning(args)) } catch (e) { return textError(`Error: ${e instanceof Error ? e.message : String(e)}`) }
  }
  )

  return server
}
