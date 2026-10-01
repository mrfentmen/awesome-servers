import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { randomQuote, quoteById, showSeasons } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: 'office-quotes-mcp', version: '1.0.0' })
  server.registerTool(
    'randomQuote',
    {
      title: "Random Quote",
      description: 'Random The Office quote.',
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await randomQuote(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    'quoteById',
    {
      title: "Quote By Id",
      description: 'Quote by id.',
      inputSchema: z.object( { id: z.number().describe('Quote id.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await quoteById(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    'showInfo',
    {
      title: "Show Info",
      description: 'Look up a television show on TVmaze: show id, status, run dates, episode length, genres, network, summary and the main cast.',
      inputSchema: z.object({ show: z.string().describe('Show name, e.g. "The Office".') }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: show_info ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_office_quotes_show_info", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    'episodeList',
    {
      title: "Episode List",
      description: 'List a television show’s episodes from TVmaze with season, number, title, air date, rating and a short summary, so you can find which episode a quote came from.',
      inputSchema: z.object({ show: z.string().describe('Show name, e.g. "The Office".'), season: z.number().describe('Limit to one season number.').optional(), limit: z.number().describe('Max episodes, 1-60, default 20.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: episode_list ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_office_quotes_episode_list", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "show_seasons",
    {
      title: "Show seasons",
      description: "Season run dates, ordered episode counts and summaries from TVmaze.",
      inputSchema: z.object({ show_id: z.number().int().min(1).max(10000000).describe("TVmaze show id, e.g. 526 for The Office."), limit: z.number().int().min(1).max(50).optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await showSeasons(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "show_crew",
    {
      title: "Show crew",
      description: "Production crew names and their credited roles from TVmaze.",
      inputSchema: z.object({ show_id: z.number().int().min(1).max(10000000).describe("TVmaze show id, e.g. 526 for The Office."), limit: z.number().int().min(1).max(50).optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: show_crew ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_office_quotes_show_crew", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
