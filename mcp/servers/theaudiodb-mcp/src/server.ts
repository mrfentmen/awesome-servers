import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { m0_album, m0_artist, m1_track } from './api.js'

const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'theaudiodb-mcp', version: '1.0.0' })
server.registerTool(
    "artist",
    {
      title: "Artist",
      description: "Search artists by name.",
      inputSchema: z.object( { name: z.string().describe("Artist name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_artist(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "album",
    {
      title: "Album",
      description: "Albums by artist.",
      inputSchema: z.object( { artist: z.string().describe("Artist name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_album(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "track",
    {
      title: "Track",
      description: "Details for one track by ID.",
      inputSchema: z.object( { id: z.number().describe("Track ID.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_track(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
