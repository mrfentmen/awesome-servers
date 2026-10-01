import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { search, artistSearch, albumSearch } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "vocadb-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search VocaDB songs.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "artist_search",
    {
      title: "Artist search",
      description: "Search VocaDB for Vocaloid artists and producers by name, with type, picture flag and a short description.",
      inputSchema: z.object( { query: z.string().describe("Artist name, e.g. camellia."), limit: z.number().int().min(1).max(25).default(8).describe("Max results.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: artist_search ----
    const paywallMessage = await premiumRequired("artist_search")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await artistSearch(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "album_search",
    {
      title: "Album search",
      description: "Search VocaDB for albums by name, with the credited artist, disc type and release date.",
      inputSchema: z.object( { query: z.string().describe("Album name, e.g. exit."), limit: z.number().int().min(1).max(25).default(8).describe("Max results.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: album_search ----
    const paywallMessage = await premiumRequired("album_search")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await albumSearch(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
