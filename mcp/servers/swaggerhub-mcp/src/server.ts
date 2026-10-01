import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { search, byOwner, apiVersions } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: 'swaggerhub-mcp', version: '1.0.0' })
  server.registerTool(
    'search',
    {
      title: "Search",
      description: 'Search the SwaggerHub registry.',
      inputSchema: z.object( { query: z.string().describe('Search terms.').optional(), limit: z.number().describe('Max results.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    'byOwner',
    {
      title: "By Owner",
      description: 'List APIs by owner.',
      inputSchema: z.object( { owner: z.string().describe('Owner user or org.').optional(), limit: z.number().describe('Max results.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await byOwner(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "sort_registry",
    {
      title: "Browse the registry",
      description: "Browse the whole SwaggerHub registry by sort order and page offset - newest, oldest, alphabetical or by owner - instead of by text search.",
      inputSchema: z.object( { sort: z.string().describe("NAME, UPDATED, CREATED, OWNER, BEST_MATCH or TITLE.").optional(), offset: z.number().describe("Entries to skip.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: sort_registry ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_swaggerhub_sort_registry", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "api_versions",
    {
      title: "API versions",
      description: "Every version SwaggerHub holds for one API, with dates, OAS level and the default version.",
      inputSchema: z.object( { owner: z.string().describe("Owner user or org, e.g. smartbear."), api: z.string().describe("API name, e.g. 0-0-0.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await apiVersions(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "spec_summary",
    {
      title: "Spec summary",
      description: "Fetch an OpenAPI spec from its SwaggerHub URL and report its title, spec version, servers, endpoint count and paths.",
      inputSchema: z.object( { spec_url: z.string().describe("Spec URL as listed in search results."), limit: z.number().describe("Max paths.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: spec_summary ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_swaggerhub_spec_summary", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
