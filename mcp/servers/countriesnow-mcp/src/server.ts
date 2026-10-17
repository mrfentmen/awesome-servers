import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { m0_cities, m0_countries, m0_flag, m1_byCode, m1_byName, m1_search, currencyTally } from "./api.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'countriesnow-mcp', version: '1.0.0' })
server.registerTool(
    "countries",
    {
      title: "Countries",
      description: "List countries with ISO codes.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_countries(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "cities",
    {
      title: "Cities",
      description: "Cities for a country.",
      inputSchema: z.object( { country: z.string().describe("Country name like Brazil.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_cities(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "flag",
    {
      title: "Flag",
      description: "Flag image URL for a country.",
      inputSchema: z.object( { country: z.string().describe("Country name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_flag(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "by_name",
    {
      title: "By name",
      description: "Get details for a country by name.",
      inputSchema: z.object( { name: z.string().describe("Country name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_byName(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "by_code",
    {
      title: "By code",
      description: "Get details for a country by code.",
      inputSchema: z.object( { code: z.string().describe("Two letter country code.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_byCode(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search countries by partial name.",
      inputSchema: z.object( { query: z.string().describe("Partial name."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_search(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "country_profile",
    {
      title: "Country profile",
      description: "One country assembled from the CountriesNow tables the other tools never read: its ISO alpha-2 and alpha-3 codes, its capital, its currency code together with the other countries that share that currency, its stored coordinates, its flag image and the shape of its population series from the first year on record to the peak. The by_name tool returns only a name, two codes, a flag and the latest population figure.",
      inputSchema: z.object( { country: z.string().describe("Country name, like Brazil.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement profile locally (paywall removed)
    try { return textError("Not yet implemented: profile") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "currency_tally",
    {
      title: "Currency tally",
      description: "The currency distribution across every country in the CountriesNow country table: how many distinct codes are in use, which codes cover the most countries, how many countries share each currency, how many have no currency recorded and how many codes belong to a single country. No existing tool reads the currency table at all.",
      inputSchema: z.object( {  } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await currencyTally()) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
