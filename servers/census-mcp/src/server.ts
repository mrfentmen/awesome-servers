import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { bachelorCount, countyPopulation } from "./api.js"
import { hispanicCount } from "./api.js"
import { housingUnits } from "./api.js"
import { medianAge } from "./api.js"
import { medianIncome } from "./api.js"
import { nationPopulation } from "./api.js"
import { povertyCount } from "./api.js"
import { statePopulation } from "./api.js"
import { unemployedCount } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "census-mcp", version: "1.0.0" })
  server.registerTool(
    "get_nation_population",
    {
      title: "Get nation population",
      description: "Get US population totals.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await nationPopulation(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "get_state_population",
    {
      title: "Get state population",
      description: "Get population for a state by FIPS code.",
      inputSchema: z.object( { state: z.string().describe("State FIPS code like 06 for California.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await statePopulation(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "get_county_population",
    {
      title: "Get county population",
      description: "Get county populations within a state.",
      inputSchema: z.object( { state: z.string().describe("State FIPS code.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await countyPopulation(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "get_median_income",
    {
      title: "Get median income",
      description: "Median household income for a state.",
      inputSchema: z.object( { state: z.string().describe("State FIPS code.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await medianIncome(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "get_poverty_count",
    {
      title: "Get poverty count",
      description: "Population below poverty for a state.",
      inputSchema: z.object( { state: z.string().describe("State FIPS code.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await povertyCount(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "get_bachelor_count",
    {
      title: "Get bachelor count",
      description: "Bachelor's degree holders for a state.",
      inputSchema: z.object( { state: z.string().describe("State FIPS code.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await bachelorCount(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "get_housing_units",
    {
      title: "Get housing units",
      description: "Housing units for a state.",
      inputSchema: z.object( { state: z.string().describe("State FIPS code.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await housingUnits(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "get_unemployed_count",
    {
      title: "Get unemployed count",
      description: "Unemployed population for a state.",
      inputSchema: z.object( { state: z.string().describe("State FIPS code.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await unemployedCount(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "get_median_age",
    {
      title: "Get median age",
      description: "Median age for a state.",
      inputSchema: z.object( { state: z.string().describe("State FIPS code.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await medianAge(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "get_hispanic_count",
    {
      title: "Get hispanic count",
      description: "Hispanic or Latino population for a state.",
      inputSchema: z.object( { state: z.string().describe("State FIPS code.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await hispanicCount(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
