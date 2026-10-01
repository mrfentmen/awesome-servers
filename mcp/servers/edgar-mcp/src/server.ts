import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { companyFacts, companyFilings, searchFilings, filingCensus, formCadence } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "edgar-mcp", version: "1.0.0" })
  server.registerTool(
    "get_company_filings",
    {
      title: "Get company filings",
      description: "Get the most recent SEC filings for a company by ticker or CIK.",
      inputSchema: z.object( { ticker: z.string().describe("Stock ticker like AAPL or a CIK number.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await companyFilings(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "get_company_facts",
    {
      title: "Get company facts",
      description: "Get XBRL company facts such as revenue and assets for a company.",
      inputSchema: z.object( { ticker: z.string().describe("Stock ticker like TSLA or a CIK number.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await companyFacts(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "search_filings",
    {
      title: "Search filings",
      description: "Full text search across recent SEC filings.",
      inputSchema: z.object( { query: z.string().describe("Search terms like insider trading or merger."), limit: z.number().describe("Max results to return.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await searchFilings(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "company_profile",
    {
      title: "Company profile",
      description: "The SEC registrant profile out of the submissions record: entity type, SIC and its description, filer category, fiscal year end, state of incorporation, exchanges and tickers, EIN and phone, business and mailing addresses, former names with their date ranges, and which older filing shards exist.",
      inputSchema: z.object( { ticker: z.string().describe("Stock ticker like AAPL or a CIK number.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: company_profile ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_edgar_company_profile", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "filing_census",
    {
      title: "Filing census",
      description: "The whole local filing history as a census: filings per form, filings per year, how much of it carries XBRL, the total primary document bytes, the earliest and latest filing date, and how many rows came from the recent block versus older shards. Optionally scoped to one year.",
      inputSchema: z.object( { ticker: z.string().describe("Stock ticker like AAPL or a CIK number."), year: z.number().describe("Scope to one filing year, 1990-2100.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await filingCensus(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "frame_peers",
    {
      title: "Frame peers",
      description: "Put a company against every other SEC filer reporting the same XBRL concept for the same period: its rank and percentile, the median and the range across filers, and the largest filers in the frame.",
      inputSchema: z.object( { ticker: z.string().describe("Stock ticker like AAPL or a CIK number."), concept: z.string().describe("us-gaap tag, default Assets.").optional(), period: z.string().describe("Frame period like CY2025Q1I, defaults to the first quarter of last year.").optional(), limit: z.number().describe("Largest filers to list, 1-10.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: frame_peers ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_edgar_frame_peers", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "form_cadence",
    {
      title: "Form cadence",
      description: "The filing cadence of one form type for a company: how many are in the recent block, the first and most recent date, the median, shortest and longest gap between filings, the item codes those filings report, and the most recent entries with their size and XBRL flag.",
      inputSchema: z.object( { ticker: z.string().describe("Stock ticker like AAPL or a CIK number."), form: z.string().describe("Form type, default 8-K.").optional(), limit: z.number().describe("Filings to list, 1-30.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await formCadence(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
