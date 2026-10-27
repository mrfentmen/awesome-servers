import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { FrankfurterError, compare, convert, currencies, dateRate, history, latest } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof FrankfurterError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "frankfurter-mcp", version: "1.0.0" })

  const codeArg = (what: string) => z.string().length(3).describe(`${what} currency code, e.g. USD`)

  server.tool("list_currencies", "Every currency Frankfurter publishes rates for.", {}, async () => {
    try {
      return text(await currencies())
    } catch (e) {
      return text(errorMessage(e))
    }
  })

  server.tool(
    "latest_rates",
    "Today's ECB reference rates for one base currency.",
    {
      base: codeArg("Base"),
      symbols: z.array(z.string().length(3)).max(30).optional().describe("Limit to these currencies"),
    },
    async ({ base, symbols }) => {
      try {
        return text(await latest(base, symbols))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "convert_currency",
    "Convert an amount between two currencies at the latest ECB rate.",
    {
      amount: z.number().positive().describe("Amount to convert"),
      from: codeArg("From"),
      to: codeArg("To"),
    },
    async ({ amount, from, to }) => {
      try {
        return text(await convert(amount, from, to))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "exchange_history",
    "How one pair moved over the last N days, with first, last, change and range.",
    {
      from: codeArg("From"),
      to: codeArg("To"),
      days: z.number().int().min(7).max(3650).default(90).describe("Lookback in days"),
    },
    async ({ from, to, days }) => {
      try {
        return text(await history(from, to, days))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "rates_on_date",
    "ECB rates for one exact date (weekends fall back to the last business day).",
    {
      date: z.string().describe("Date as YYYY-MM-DD"),
      base: codeArg("Base"),
      to: z.string().length(3).optional().describe("Optional single currency to narrow to"),
    },
    async ({ date, base, to }) => {
      try {
        return text(await dateRate(date, base, to))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "compare_currencies",
    "Percent move of several currencies against USD over a window.",
    {
      currencies: z.array(z.string().length(3)).min(2).max(20).describe("Currency codes to compare"),
      days: z.number().int().min(7).max(3650).default(90).describe("Lookback in days"),
    },
    async ({ currencies: list, days }) => {
      try {
        return text(await compare(list, days))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}
