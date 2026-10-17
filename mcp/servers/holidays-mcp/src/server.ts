import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { m0_publicHolidays, m0_nextHolidays, m0_countries, m0_openHolidays, m1_holidays } from "./api.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'holidays-mcp', version: '1.0.0' })
server.registerTool(
    'publicHolidays',
    {
      title: "Public Holidays",
      description: 'Public holidays for a country and year from Nager.Date.',
      inputSchema: z.object( { year: z.number().describe('Year.').optional(), country: z.string().describe('ISO country code, default US.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_publicHolidays(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    'nextHolidays',
    {
      title: "Next Holidays",
      description: 'Upcoming public holidays from Nager.Date.',
      inputSchema: z.object( { country: z.string().describe('ISO country code, default US.').optional(), limit: z.number().describe('Max results.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_nextHolidays(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    'countries',
    {
      title: "Countries",
      description: 'List countries supported by Open Holidays.',
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
    try { return text(await m0_countries()) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    'openHolidays',
    {
      title: "Open Holidays",
      description: 'Public holidays for a country and year from Open Holidays.',
      inputSchema: z.object( { country: z.string().describe('ISO country code.').optional(), year: z.number().describe('Year.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_openHolidays(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "holidays",
    {
      title: "Holidays",
      description: "Public holidays for a country and year.",
      inputSchema: z.object( { country: z.string().describe("Country code."), year: z.number().describe("Year.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_holidays(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "available_countries",
    {
      title: "Available countries",
      description: "The country codes the holidays tool accepts, with each country's name, so you can pick a valid code before querying.",
      inputSchema: z.object( { search: z.string().describe("Filter by country name or exact code.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement countries locally (paywall removed)
    try { return textError("Not yet implemented: countries") } catch (e) { return textError(String(e)) }
    }
  );

  return server
}
