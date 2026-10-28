import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { companyConcept, companyProfile, fullTextSearch, tickerLookup, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "sec-edgar-mcp", version: "1.0.1" })

  server.tool(
    "company_profile",
    "A company by CIK: name, SIC industry, tickers and recent filings.",
    {
      cik: z.string().min(1).max(12).describe("CIK, with or without leading zeros, e.g. 320193 or CIK0000320193")
    },
    async (a) => {
      try {
        return text(await companyProfile(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "company_concept",
    "Historical values of one XBRL tag (a financial concept) for a company.",
    {
      cik: z.string().min(1).max(12).describe("CIK, e.g. 320193"),
      tag: z.string().min(2).describe("US-GAAP tag, e.g. Revenues or Assets"),
      limit: z.number().int().min(1).max(30).default(10).describe("Reported periods to return")
    },
    async (a) => {
      try {
        return text(await companyConcept(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "full_text_search",
    "Search filing text across EDGAR, newest first.",
    {
      query: z.string().min(2).describe("Words to search for, e.g. climate risk"),
      forms: z.string().optional().describe("Optional form filter, e.g. 10-K or 8-K"),
      limit: z.number().int().min(1).max(20).default(5).describe("Filings to return")
    },
    async (a) => {
      try {
        return text(await fullTextSearch(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "ticker_lookup",
    "Convert a stock ticker to the company name and CIK.",
    {
      ticker: z.string().min(1).max(8).describe("Ticker symbol, e.g. AAPL")
    },
    async (a) => {
      try {
        return text(await tickerLookup(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
