import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { search, user } from "./api.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: 'mixcloud-mcp', version: '1.0.0' })
  server.registerTool(
    'search',
    {
      title: "Search",
      description: 'Search Mixcloud cloudcasts.',
      inputSchema: z.object( { query: z.string().describe('Search terms.').optional(), limit: z.number().describe('Max results.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    'user',
    {
      title: "User",
      description: 'Mixcloud user profile.',
      inputSchema: z.object( { user: z.string().describe('User name.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await user(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "user_cloudcasts",
    {
      title: "User cloudcasts",
      description: "The most recent cloudcasts a Mixcloud user has uploaded, with length, play, like and comment counts.",
      inputSchema: z.object( { user: z.string().describe("Mixcloud user name."), limit: z.number().int().min(1).max(20).default(8).describe("Max cloudcasts.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement cloudcasts locally (paywall removed)
    try { return textError("Not yet implemented: cloudcasts") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "user_playlists",
    {
      title: "User playlists",
      description: "The playlists a Mixcloud user has published, with how many cloudcasts each one holds.",
      inputSchema: z.object( { user: z.string().describe("Mixcloud user name."), limit: z.number().int().min(1).max(30).default(10).describe("Max playlists.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement playlists locally (paywall removed)
    try { return textError("Not yet implemented: playlists") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
