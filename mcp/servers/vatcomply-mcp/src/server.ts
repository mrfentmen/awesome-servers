import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { exchangeRates, vatRates } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "vatcomply-mcp", version: "1.0.0" })

  server.tool(
    "exchange_rates",
    "Latest rates for a base currency",
    { base: z.string().length(3).describe("Three letter base currency, e.g. USD") },
    async ({ base }) => {
      try {
        return text(await exchangeRates(base))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "vat_rates",
    "EU VAT rates by country",
    {  },
    async ({  }) => {
      try {
        return text(await vatRates())
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
