import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, listStores, listProducts, getProduct, feeBreakdown, payoutSchedule } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "lemonsqueezy-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_stores",
    {
      title: "List stores",
      description: "Lemon Squeezy stores on the account.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listStores());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_products",
    {
      title: "List products",
      description: "Products, optionally for one store.",
      inputSchema: z.object({
        store_id: z.string().describe("Filter by store ID.").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ store_id }) => {
      try {
        return text(await listProducts(store_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_product",
    {
      title: "Get product",
      description: "One product by id, with price and variants.",
      inputSchema: z.object({
        product_id: z.string().describe("Lemon Squeezy product ID, e.g. 123456")
      }),
      annotations: READ_ONLY,
    },
    async ({ product_id }) => {
      try {
        return text(await getProduct(product_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "fee_breakdown",
    {
      title: "Fee breakdown",
      description: "Where a sale's money actually goes: percentage fee, fixed fee, currency conversion fee, tax withheld and refund, the net payout, the effective take rate and the sale size at which the fixed fees stop mattering. No key, no fetch.",
      inputSchema: z.object({ gross: z.number().describe("Gross amount of the sale."), percentage_fee: z.number().describe("Processor percentage fee, e.g. 0.05 for 5%.").optional(), fixed_fee: z.number().describe("Fixed per-transaction fee.").optional(), currency_fee: z.number().describe("Currency conversion fee.").optional(), tax_withheld: z.number().describe("Tax withheld by the processor.").optional(), refund: z.number().describe("Amount refunded to the buyer.").optional(), currency: z.string().describe("ISO currency code, default USD.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: fee_breakdown ----
      const paywallMessage = await premiumRequired("fee_breakdown")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try { return text(await feeBreakdown(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "payout_schedule",
    {
      title: "Payout schedule",
      description: "When money would actually arrive: the next payout dates for a daily, weekly, biweekly or monthly cadence, with the minimum threshold, a rolling reserve, the amount released and the float in days. No key, no fetch.",
      inputSchema: z.object({ cadence: z.enum(["daily", "weekly", "biweekly", "monthly"]).default("monthly").describe("Payout cadence."), min_threshold: z.number().describe("Minimum balance before a payout is made.").optional(), reserve_rate: z.number().describe("Share held back, e.g. 0.05 for 5%.").optional(), periods: z.number().int().min(1).max(12).default(6).describe("How many payout dates to list (default 6, max 12)."), starting_balance: z.number().describe("Balance the schedule starts from.").optional(), currency: z.string().describe("ISO currency code, default USD.").optional(), from_date: z.string().describe("Anchor date, YYYY-MM-DD. Today by default.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: payout_schedule ----
      const paywallMessage = await premiumRequired("payout_schedule")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try { return text(await payoutSchedule(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  return server
}