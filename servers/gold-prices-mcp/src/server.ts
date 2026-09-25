import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { all, convert, errorMessage, marketOverview, price, symbols } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({ name: "gold-prices-mcp", version: "1.0.0" })

  server.registerTool(
    "price",
    {
      title: "Price",
      description:
        "Live spot price for one metal or asset in USD, with the quote source and timestamp. Accepts a ticker (XAU) or a name (gold).",
      inputSchema: z.object({
        metal: z.string().describe("XAU gold, XAG silver, XPT platinum, XPD palladium, HG copper, BTC, ETH. Defaults to gold.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await price(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "all",
    {
      title: "All precious metals",
      description: "Spot prices for the four precious metals in one call: gold, silver, platinum and palladium.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try { return text(await all()) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "market_overview",
    {
      title: "Market overview",
      description:
        "One call for every asset the price feed tracks — precious metals, copper, Bitcoin and Ethereum — with live USD prices.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try { return text(await marketOverview()) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "symbols",
    {
      title: "Symbols",
      description:
        "The ticker symbols this price feed supports, so an agent knows which values price and convert accept.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try { return text(await symbols()) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "convert",
    {
      title: "Convert",
      description:
        "Value an amount of one asset in USD, or in another tracked asset, using live prices. Example: 2 ounces of gold in USD, or 100 grams of silver in gold.",
      inputSchema: z.object({
        amount: z.number().describe("How much of the source asset, e.g. 1.5."),
        from: z.string().describe("Source ticker or name, e.g. XAU or gold."),
        to: z.string().describe("Target ticker, or USD for dollars (default USD).").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await convert(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  return server
}
