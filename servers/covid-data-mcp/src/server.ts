import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { country, global, countryComparison } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "covid-data-mcp", version: "1.0.0" })
  server.registerTool(
    "country",
    {
      title: "Country",
      description: "COVID stats for one country.",
      inputSchema: z.object( { name: z.string().describe("Country name or code.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await country(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "global",
    {
      title: "Global",
      description: "Global COVID totals.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await global(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "country_ranking",
    {
      title: "Country ranking",
      description: "Rank countries by cases, deaths, active, critical or per-million rates, with a population floor.",
      inputSchema: z.object( { metric: z.string().describe("cases, deaths, recovered, active, critical, deaths_per_million or cases_per_million.").optional(), limit: z.number().describe("Max countries.").optional(), min_population: z.number().describe("Ignore countries below this population.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: country_ranking ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_covid_data_country_ranking", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "continent_report",
    {
      title: "Continent report",
      description: "COVID case, death, recovery and test totals for every continent, with each share of global deaths.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: continent_report ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_covid_data_continent_report", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "country_comparison",
    {
      title: "Country comparison",
      description: "Side by side table of several countries: cases, deaths, per million rates, recovered, active, tests and population.",
      inputSchema: z.object( { countries: z.string().describe("Comma separated country names, e.g. France, Germany, Italy.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await countryComparison(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
