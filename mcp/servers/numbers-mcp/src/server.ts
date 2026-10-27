import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { convertBase, formatNumber, fromRoman, statistics, toRoman, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "numbers-mcp", version: "1.0.1" })

  server.tool(
    "statistics",
    "Summarise a list of numbers: mean, median, mode, spread and quartiles.",
    {
      values: z.array(z.number()).min(1).max(10000).describe("Numbers to summarise"),
      sample: z.boolean().default(true).describe("Use the sample (n-1) denominator for variance")
    },
    async (a) => {
      try {
        return text(await statistics(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "to_roman",
    "Convert a whole number to a Roman numeral.",
    {
      value: z.number().int().min(1).max(3999).describe("Number from 1 to 3999")
    },
    async (a) => {
      try {
        return text(await toRoman(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "from_roman",
    "Convert a Roman numeral to a number, with validation.",
    {
      roman: z.string().min(1).max(30).describe("Roman numeral, e.g. MCMXCIV")
    },
    async (a) => {
      try {
        return text(await fromRoman(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "convert_base",
    "Convert a whole number between bases 2 and 36.",
    {
      value: z.string().min(1).max(80).describe("Number to convert, e.g. ff01"),
      fromBase: z.number().int().min(2).max(36).describe("Base of the input, 2-36"),
      toBase: z.number().int().min(2).max(36).describe("Base of the output, 2-36")
    },
    async (a) => {
      try {
        return text(await convertBase(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "format_number",
    "Format a number for a locale: decimal, percent, currency or compact.",
    {
      value: z.number().describe("Number to format"),
      style: z.enum(["decimal", "percent", "currency", "compact"]).default("decimal").describe("Formatting style"),
      locale: z.string().default("en-US").describe("BCP-47 locale, e.g. en-US, de-DE or ja-JP"),
      currency: z.string().length(3).optional().describe("ISO 4217 code, required for the currency style"),
      decimals: z.number().int().min(0).max(6).optional().describe("Fixed number of fraction digits")
    },
    async (a) => {
      try {
        return text(await formatNumber(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}
