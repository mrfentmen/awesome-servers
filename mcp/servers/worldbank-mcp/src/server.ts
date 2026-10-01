import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { m0_countries, m0_indicator, m1_eiaSeries, m1_worldbankIndicator } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'worldbank-mcp', version: '1.0.0' })
server.registerTool(
    "indicator",
    {
      title: "Indicator",
      description: "Indicator series for a country.",
      inputSchema: z.object( { country: z.string().describe("Country code like USA."), indicatorCode: z.string().describe("Indicator code like NY.GDP.MKTP.CD."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_indicator(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "countries",
    {
      title: "Countries",
      description: "List World Bank countries.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_countries(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "get_worldbank_indicator",
    {
      title: "Get worldbank indicator",
      description: "Get a World Bank development indicator for a country.",
      inputSchema: z.object( { indicator: z.string().describe("Indicator code like EG.USE.ELEC.KH.PC."), country: z.string().describe("ISO country code like USA.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_worldbankIndicator(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "get_eia_series",
    {
      title: "Get eia series",
      description: "Get an EIA energy series. Requires a free EIA key.",
      inputSchema: z.object( { series_id: z.string().describe("EIA series id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_eiaSeries(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "country_profile",
    {
      title: "Country profile",
      description: "A country's own World Bank record: region, income group, lending type, capital city and coordinates, which the data tools never show.",
      inputSchema: z.object( { country: z.string().describe("Two or three letter code, e.g. USA."), }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: country_profile ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_worldbank_country_profile", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "indicator_catalog",
    {
      title: "Indicator catalog",
      description: "Search the World Bank's indicator directory by name or code, so you can find an indicator id before asking the data tools for its series.",
      inputSchema: z.object( { query: z.string().describe("Search term, e.g. GDP.").optional(), limit: z.number().describe("Max indicators.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: indicator_catalog ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_worldbank_indicator_catalog", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
