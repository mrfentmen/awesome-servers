import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { m0_artwork, m0_search, exhibitionSearch } from "./api.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'art-institute-mcp', version: '1.0.0' })
server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search artworks by text.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_search(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "artwork",
    {
      title: "Artwork",
      description: "Details for one artwork.",
      inputSchema: z.object( { id: z.number().describe("Artwork ID.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_artwork(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "collection_profile",
    {
      title: "Collection profile",
      description: "The shape of a whole Art Institute search rather than its first rows: how many distinct artists, media, departments and classifications a term returns, the century distribution, how much of the page is public domain, and how many rows carry a usable date. The search tool returns one line per hit and never a total or a breakdown.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("How many artworks to read for the profile, 10 to 100.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement profile locally (paywall removed)
    try { return textError("Not yet implemented: profile") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "exhibition_search",
    {
      title: "Exhibition search",
      description: "The Art Institute's exhibition archive, which no tool on this server has read: exhibition title, its opening and closing dates, its page url and how many artworks the record lists, for any search term. A different entity entirely from the artwork search and detail tools.",
      inputSchema: z.object( { query: z.string().describe("Search terms, like Monet or modern."), limit: z.number().describe("Max exhibitions, 1 to 25.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await exhibitionSearch(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
