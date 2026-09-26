import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { exchange } from "./api.js"
import { buy } from "./api.js"
import { currencies } from "./api.js"
import { sell } from "./api.js"
import { spot } from "./api.js"
import { time } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "coinbase-mcp", version: "1.0.0" })
  server.registerTool(
    "spot",
    {
      title: "Spot",
      description: "Latest spot price for one pair, e.g. BTC-USD.",
      inputSchema: z.object( { pair: z.string().describe("Pair like BTC-USD.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await spot(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "exchange",
    {
      title: "Exchange",
      description: "Crypto-to-fiat exchange rates for one base currency.",
      inputSchema: z.object( { currency: z.string().describe("Base currency like USD.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await exchange(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "buy",
    {
      title: "Buy price",
      description: "Coinbase buy price for a pair, returns base, currency and amount.",
      inputSchema: z.object( { pair: z.string().describe("Pair like BTC-USD.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await buy(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "sell",
    {
      title: "Sell price",
      description: "Coinbase sell price for a pair, returns base, currency and amount.",
      inputSchema: z.object( { pair: z.string().describe("Pair like BTC-USD.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await sell(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "currencies",
    {
      title: "Currencies",
      description: "How many currencies Coinbase supports with a fiat count and a 15-code sample. Full list omitted for size.",
      inputSchema: z.object( { }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await currencies()) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "time",
    {
      title: "Server time",
      description: "Coinbase server time as ISO string and epoch, useful for timestamping quotes.",
      inputSchema: z.object( { }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await time()) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
