import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { top, jobs, ask, frontPage } from "./api.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: 'hacker-news-mcp', version: '1.0.0' })
  server.registerTool(
    'top',
    {
      title: "Top",
      description: 'Top stories from the Hacker News Firebase API.',
      inputSchema: z.object( { limit: z.number().describe('Max stories.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await top(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    'jobs',
    {
      title: "Jobs",
      description: 'Latest job postings.',
      inputSchema: z.object( { limit: z.number().describe('Max jobs.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await jobs(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    'ask',
    {
      title: "Ask",
      description: 'Latest Ask HN threads.',
      inputSchema: z.object( { limit: z.number().describe('Max threads.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await ask(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    'item',
    {
      title: "Item",
      description: 'Look up one Hacker News item by id.',
      inputSchema: z.object( { id: z.number().describe('Item id.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement item locally (paywall removed)
    try { return textError("Not yet implemented: item") } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    'search',
    {
      title: "Search",
      description: 'Search stories on Algolia.',
      inputSchema: z.object( { query: z.string().describe('Search query.').optional(), limit: z.number().describe('Max results.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement search locally (paywall removed)
    try { return textError("Not yet implemented: search") } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    'frontPage',
    {
      title: "Front Page",
      description: 'Current front page from Algolia.',
      inputSchema: z.object( { limit: z.number().describe('Max stories.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await frontPage(args)) } catch (e) { return textError(String(e)) }
  }
  )
  return server
}
