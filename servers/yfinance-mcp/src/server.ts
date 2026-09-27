import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { m0_quote, m0_search, m1_quote, m1_searchSymbol, gainers, losers, actives, trending, dividendHistory, volumeSpike, benchmarkCompare } from './api.js'
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
export function createServer(): McpServer {
  const server = new McpServer({ name: 'yfinance-mcp', version: '1.0.0' })
server.registerTool(
    "quote",
    {
      title: "Quote",
      description: "Get a stock quote and recent price data.",
      inputSchema: z.object( { symbol: z.string().describe("Stock symbol like AAPL."), range: z.string().describe("Range like 5d, 1mo, 1y.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_quote(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search stock symbols by company name, e.g. apple.",
      inputSchema: z.object( { query: z.string().describe("Company name or symbol.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_search(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "search_symbol",
    {
      title: "Search symbol",
      description: "Search for a symbol by company name.",
      inputSchema: z.object( { query: z.string().describe("Company name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_searchSymbol(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "gainers",
    {
      title: "Day gainers",
      description: "Equities with the greatest gains today with price and percent change.",
      inputSchema: z.object( { limit: z.number().describe("How many gainers, 1-25. Defaults to 10.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await gainers(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "losers",
    {
      title: "Day losers",
      description: "Equities with the greatest losses today with price and percent change.",
      inputSchema: z.object( { limit: z.number().describe("How many losers, 1-25. Defaults to 10.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await losers(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "actives",
    {
      title: "Most actives",
      description: "Most actively traded equities with price and percent change.",
      inputSchema: z.object( { limit: z.number().describe("How many symbols, 1-25. Defaults to 10.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await actives(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "trending",
    {
      title: "Trending tickers",
      description: "Trending US ticker symbols. Use quote for prices.",
      inputSchema: z.object( { limit: z.number().describe("How many symbols, 1-25. Defaults to 10.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await trending(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "dividend_history",
    {
      title: "Dividend history",
      description:
        "Every dividend payment in the range with the total paid per share, the latest payment and its change, and a year by year breakdown.",
      inputSchema: z.object({
        symbol: z.string().describe("Stock symbol, e.g. AAPL."),
        range: z.string().describe("Range like 1y, 5y, max. Defaults to 1y.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ symbol, range }) => {
      try {
        return text(await dividendHistory({ symbol, range }))
      } catch (e) {
        return textError(error(e))
      }
    }
  )

  server.registerTool(
    "volume_spike",
    {
      title: "Volume spike",
      description:
        "Latest trading volume against the average of the days before it, with the ratio, a plain verdict and the heaviest days in the window.",
      inputSchema: z.object({
        symbol: z.string().describe("Stock symbol, e.g. NVDA."),
        lookback: z.number().describe("Trading days to average over (default 90, max 1000).").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ symbol, lookback }) => {
      try {
        return text(await volumeSpike({ symbol, lookback }))
      } catch (e) {
        return textError(error(e))
      }
    }
  )

  server.registerTool(
    "benchmark_compare",
    {
      title: "Benchmark compare",
      description:
        "Compare two to five symbols over the same range by percent return, ranked, with the spread between the best and the worst.",
      inputSchema: z.object({
        symbols: z.array(z.string()).describe("Two to five symbols, e.g. ['AAPL', 'MSFT', 'NVDA']."),
        range: z.string().describe("Range like 1mo, 1y, 5y. Defaults to 1y.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ symbols, range }) => {
      try {
        return text(await benchmarkCompare({ symbols, range }))
      } catch (e) {
        return textError(error(e))
      }
    }
  )

  return server
}
