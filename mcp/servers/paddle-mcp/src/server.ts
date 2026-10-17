import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, listProducts, getProduct, listPrices, listFxRates, convertAmount, fxRateHistory } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "paddle-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_products",
    {
      title: "List products",
      description: "Paddle products with price and status.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listProducts());
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "get_product",
    {
      title: "Get product",
      description: "One Paddle product by id, with price and status.",
      inputSchema: z.object({
        product_id: z.string().describe("Product ID (pro_...).")
      }),
      annotations: READ_ONLY,
    },
    async ({ product_id }) => {
      try {
        return text(await getProduct(product_id));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "list_prices",
    {
      title: "List prices",
      description: "Prices, optionally for one product.",
      inputSchema: z.object({
        product_id: z.string().describe("Filter by product ID.").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ product_id }) => {
      try {
        return text(await listPrices(product_id));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "list_fx_rates",
    {
      title: "List daily reference rates",
      description:
        "The full daily reference exchange-rate board for one base currency (European Central Bank rates, 30 currencies).",
      inputSchema: z.object({
        base: z.string().describe("3-letter ISO 4217 code to quote everything against, e.g. 'EUR' or 'USD'.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await listFxRates(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "convert_amount",
    {
      title: "Convert an amount",
      description:
        "Convert a price or balance between two currencies at the latest European Central Bank reference rate.",
      inputSchema: z.object({
        amount: z.number().describe("Amount in the source currency."),
        from: z.string().describe("3-letter ISO 4217 source code, e.g. 'USD'."),
        to: z.string().describe("3-letter ISO 4217 target code, e.g. 'EUR'."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await convertAmount(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "fx_rate_history",
    {
      title: "Exchange-rate history",
      description:
        "How a currency pair has moved over a window of days: the first and last published rate, the change, and the high, low and mean across the window.",
      inputSchema: z.object({
        from: z.string().describe("3-letter ISO 4217 base code, e.g. 'USD'."),
        to: z.string().describe("3-letter ISO 4217 quote code, e.g. 'JPY'."),
        days: z.number().describe("Window length in days, 2-3650. Defaults to 30.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await fxRateHistory(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}