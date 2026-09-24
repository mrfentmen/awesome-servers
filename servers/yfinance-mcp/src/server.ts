import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { m0_quote, m0_search, m1_quote, m1_searchSymbol } from './api.js'

const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

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
      description: "Search stock symbols.",
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
  return server
}
