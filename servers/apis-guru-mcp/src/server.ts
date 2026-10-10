import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { search, byName, apiDirectoryStats } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: 'apis-guru-mcp', version: '1.0.0' })
  server.registerTool(
    'search',
    {
      title: "Search",
      description: 'Search the APIs.guru directory.',
      inputSchema: z.object( { query: z.string().describe('Search terms.').optional(), limit: z.number().describe('Max results.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    'byName',
    {
      title: "By Name",
      description: 'Get one API by directory name.',
      inputSchema: z.object( { name: z.string().describe('Name like openai.com.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await byName(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "api_endpoints",
    {
      title: "API endpoints",
      description: "List the operations in a published OpenAPI spec for an APIs.guru directory entry, with HTTP method, path, summary and operation id.",
      inputSchema: z.object( { name: z.string().describe("Directory key, e.g. google.com or stripe.com[2022-11-15]."), version: z.string().describe("Spec version, e.g. v3.").optional(), search: z.string().describe("Filter paths and summaries.").optional(), limit: z.number().describe("Max operations.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: api_endpoints ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_apis_guru_api_endpoints", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "api_versions",
    {
      title: "API versions",
      description: "Every published spec version for an APIs.guru entry with its OpenAPI version, added and updated dates, and optionally the number of paths in each spec.",
      inputSchema: z.object( { name: z.string().describe("Directory key, e.g. google.com."), endpoint_counts: z.boolean().describe("Count paths in each spec, which fetches every spec.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: api_versions ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_apis_guru_api_versions", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "api_directory_stats",
    {
      title: "Directory stats",
      description: "Aggregate the APIs.guru directory by provider, by number of published versions, or by most recently added entry.",
      inputSchema: z.object( { group_by: z.string().describe("provider, version_count or recent.").optional(), limit: z.number().describe("Max rows.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await apiDirectoryStats(args)) } catch (e) { return textError(e instanceof Error ? `Error: ${e.message}` : String(e)) }
  }
  )

  return server
}
