import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { countries, holidays, countryCoverage } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "enrico-mcp", version: "1.0.0" })
  server.registerTool(
    "countries",
    {
      title: "Countries",
      description: "List supported countries.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async () => {
    try { return text(await countries()) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "holidays",
    {
      title: "Holidays",
      description: "Public holidays for a country and year.",
      inputSchema: z.object( { country: z.string().describe("Country code like USA."), year: z.number().describe("Year.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await holidays(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "country_coverage",
    {
      title: "Country coverage",
      description: "What the Enrico holiday service actually covers across all its countries: every holiday type in the catalogue and how many countries offer each, the earliest year any country starts at, which countries name a real end year rather than a placeholder, and which countries are split into regions. The countries tool prints only a code and a name and stops at 30 of them.",
      inputSchema: z.object( {  } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await countryCoverage()) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "country_calendar",
    {
      title: "Country calendar",
      description: "Every holiday type Enrico serves for one country in one year, not just public holidays: observances, other days, extra working days, school holidays and postal holidays, with the English name where the record carries one, the weekday, the country's real coverage window and its region codes. The holidays tool reads a single type and takes only the first name in each record.",
      inputSchema: z.object( { country: z.string().describe("Three letter country code like USA or DEU."), year: z.number().describe("Year, 1940 to 2100.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: country_calendar ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_enrico_country_calendar", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
