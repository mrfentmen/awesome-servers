import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { m0_quoteOfTheDay, m0_randomQuote, m1_qotd, m1_search, m2_random, m3_many, m3_random, m4_random, m4_today, m4_quotes } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'quotes-mcp', version: '1.0.0' })
server.registerTool(
    "quote_of_the_day",
    {
      title: "Quote of the day",
      description: "Get the quote of the day.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_quoteOfTheDay(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "random_quote",
    {
      title: "Random quote",
      description: "Get a random quote.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_randomQuote(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "qotd",
    {
      title: "Qotd",
      description: "Quote of the day.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_qotd(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search quotes.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_search(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "random",
    {
      title: "Random",
      description: "A random inspirational quote.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m2_random(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "many",
    {
      title: "Many",
      description: "Several quotes.",
      inputSchema: z.object( { count: z.number().describe("How many.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m3_many(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    'today',
    {
      title: "Today",
      description: 'Quote of the day.',
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m4_today(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    'quotes',
    {
      title: "Quotes",
      description: 'List of quotes.',
      inputSchema: z.object( { limit: z.number().describe('Max results.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m4_quotes(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "quote_by_id",
    {
      title: "Quote by id",
      description: "One specific quote from the DummyJSON catalogue by its numeric id, for pulling a known line.",
      inputSchema: z.object( { id: z.number().describe("Quote id, 1 to 1000.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: quote_by_id ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_quotes_quote_by_id", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
