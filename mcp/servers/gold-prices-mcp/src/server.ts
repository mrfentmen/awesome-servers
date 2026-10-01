import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { all, convert, errorMessage, marketOverview, metalRatios, portfolioValue, price, symbols, meltValue, premiumCheck, priceTrend } from "./api.js"
import { premiumTool } from "./gateway.js"
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

  server.registerTool(
    "portfolio_value",
    {
      title: "Portfolio value",
      description:
        "Value a list of metal and crypto holdings in USD at live prices, with each holding's share of the total. Example: XAU:2, XAG:100, BTC:0.5.",
      inputSchema: z.object({
        holdings: z.string().describe('Comma separated SYMBOL:AMOUNT pairs, e.g. "XAU:2, XAG:100, BTC:0.5". Accepts names like gold or silver too.')
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await portfolioValue(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "metal_ratios",
    {
      title: "Asset ratios",
      description:
        "Live ratios traders watch — gold/silver, gold/platinum, gold/palladium, gold/copper and bitcoin/gold — both sides quoted at once.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try { return text(await metalRatios()) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "melt_value",
    {
      title: "Melt value",
      description: "Metal content value of a weight in any bullion unit (g, troy oz, dwt, tola, kg) at any purity.",
      inputSchema: z.object({
        weight: z.number().describe("Weight of one item, e.g. 1 or 31.1."),
        unit: z.string().describe("g, troy_oz, dwt, tola, grain, kg or lb (default g).").optional(),
        metal: z.string().describe("XAU, XAG, XPT, XPD or an alias like gold (default XAU).").optional(),
        purity: z.string().describe("24k, 18k, 0.999 or 925 (default pure).").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await meltValue(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "premium_check",
    {
      title: "Premium check",
      description: "What you paid versus live melt value: premium in dollars and percent, with a plain reading.",
      inputSchema: z.object({
        weight: z.number().describe("Weight of one item, e.g. 1."),
        unit: z.string().describe("g, troy_oz, dwt, tola, grain, kg or lb (default g).").optional(),
        metal: z.string().describe("XAU, XAG, XPT, XPD or an alias like gold (default XAU).").optional(),
        purity: z.string().describe("24k, 18k, 0.999 or 925 (default pure).").optional(),
        paid: z.number().describe("Total paid in USD for the whole lot."),
        quantity: z.number().describe("How many identical items (default 1).").optional(),
        label: z.string().describe("Optional label to echo back, e.g. '1 oz Krugerrand'.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await premiumCheck(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "price_trend",
    {
      title: "Price trend",
      description: "Daily close trend for a metal over 5d to 1y: change, range and the last ten closes.",
      inputSchema: z.object({
        metal: z.string().describe("XAU, XAG, XPT or XPD (default XAU).").optional(),
        range: z.string().describe("5d, 1mo, 3mo, 6mo, 1y or ytd (default 1mo).").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await priceTrend(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "tokenised_metal",
    {
      title: "Tokenised metal",
      description: "Gold-backed tokens priced against spot gold, with the premium or discount to the metal each token claims to represent.",
      inputSchema: z.object({
        metal: z.string().describe("Metal symbol, e.g. XAU. Tokens are tracked for XAU.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: tokenised_metal ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_gold_prices_tokenised_metal", args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "futures_curve",
    {
      title: "Futures curve",
      description: "Front-month gold, silver, platinum, palladium and copper futures against spot, so contango or backwardation is visible.",
      inputSchema: z.object({
        metals: z.string().describe("Comma separated metal symbols, e.g. 'XAU,XAG'. Defaults to all five.").optional(),
        limit: z.number().int().min(1).max(5).default(5).describe("How many metals to compare."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: futures_curve ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_gold_prices_futures_curve", args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  return server
}
