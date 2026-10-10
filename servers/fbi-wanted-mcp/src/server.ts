import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { wantedList, search, topRewards, officeSummary } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: 'fbi-wanted-mcp', version: '1.0.0' })
  server.registerTool(
    'wantedList',
    {
      title: "Wanted List",
      description: 'Paginated FBI Wanted list.',
      inputSchema: z.object( { page: z.number().describe('Page number.').optional(), pageSize: z.number().describe('Results per page.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await wantedList(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    'search',
    {
      title: "Search",
      description: 'Search FBI Wanted by title.',
      inputSchema: z.object( { title: z.string().describe('Search term.').optional(), pageSize: z.number().describe('Results per page.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    'topRewards',
    {
      title: "Top Rewards",
      description: 'Most wanted with reward amounts.',
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await topRewards(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "wanted_by_office",
    {
      title: "Wanted by office",
      description: "FBI wanted persons handled by one field office, a filter the plain list does not expose, with the API's real total for that office.",
      inputSchema: z.object( { office: z.string().describe("Field office name, like newyork, losangeles or chicago. Punctuation and spaces are ignored."), pageSize: z.number().describe("How many to list, 1-50. Defaults to 10.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: wanted_by_office ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_fbi_wanted_wanted_by_office", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "office_summary",
    {
      title: "Office summary",
      description: "How a sample of the FBI wanted list breaks down by field office and poster classification, with how many carry a reward. States the sample size so the totals are not read as the whole dataset.",
      inputSchema: z.object( { sampleSize: z.number().describe("How many entries to sample, 1-50. Defaults to 50.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await officeSummary(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
