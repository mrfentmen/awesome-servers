import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { list, regionSummary } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "datahub-countries-mcp", version: "1.0.0" })
  server.registerTool(
    "list",
    {
      title: "List",
      description: "List countries with codes.",
      inputSchema: z.object( { search: z.string().describe("Optional search terms.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await list(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "country_details",
    {
      title: "Country details",
      description: "Full record for one country from any ISO, M49, FIFA or numeric code: capital, continent, region, calling code, TLD, languages, currency, development flags and cross reference codes.",
      inputSchema: z.object( { code: z.string().describe("Name or any code, e.g. FR, FRA, 250 or 33.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement details locally (paywall removed)
    try { return textError("Not yet implemented: details") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "code_lookup",
    {
      title: "Code lookup",
      description: "Reverse lookup across the code tables the country list also carries, including ISO alpha-2 and alpha-3, numeric, M49, FIFA, calling code, MARC, FIPS, WMO, ITU, IOC, TLD, Wikidata and Geonames.",
      inputSchema: z.object( { code: z.string().describe("Any code, e.g. 250, FRA, 33, .fr or Q142.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement lookup locally (paywall removed)
    try { return textError("Not yet implemented: lookup") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "region_summary",
    {
      title: "Region summary",
      description: "Group every country code entry by continent, region, intermediate region or sub-region with entry counts, independent state counts and the ISO codes in each group.",
      inputSchema: z.object( { level: z.string().describe("Continent, Region Name, Intermediate Region Name or Sub-region Name.").optional(), limit: z.number().describe("Max groups.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await regionSummary(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
