import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { instruments, ticker } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "deribit-mcp", version: "1.0.0" })

  server.tool(
    "instruments",
    "Tradable Deribit instruments for a currency, with expiry, strike and option type.",
    {
      currency: z.string().default("BTC").describe('Currency, e.g. "BTC" or "ETH"'),
      kind: z.enum(["future", "option", "spot", "future_combo", "option_combo"]).default("future").describe("Instrument kind"),
      limit: z.number().int().min(1).max(100).default(20).describe("How many instruments to list"),
    },
    async ({ currency, kind, limit }) => {
      try {
        return text(await instruments(currency, kind, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "ticker",
    "Live ticker for one Deribit instrument: last, mark, index, bid/ask, volume, open interest, funding.",
    { instrument: z.string().min(3).describe('Instrument name, e.g. "BTC-PERPETUAL" or "BTC-27DEC26-100000-C"') },
    async ({ instrument }) => {
      try {
        return text(await ticker(instrument))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
