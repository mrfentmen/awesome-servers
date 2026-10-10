import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { release, search, masterRelease } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "discogs-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search releases.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "release",
    {
      title: "Release",
      description: "Get a release by id.",
      inputSchema: z.object( { id: z.number().describe("Release id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await release(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "artist_profile",
    {
      title: "Artist profile",
      description: "A Discogs artist in full: real name, written profile, name variations, aliases, group and member credits, links, and their credited catalogue tallied by year, entry type, credit role and format. The release tool reads a release, so an artist's own record and their catalogue are both invisible to it.",
      inputSchema: z.object( { artist_id: z.number().describe("Discogs artist id, like 1.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: artist_profile ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_discogs_artist_profile", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "master_release",
    {
      title: "Master release",
      description: "A Discogs master release: the recording with its main release, its tracklist, how many pressings exist and every pressing with its country, date, format, label and catalogue number, tallied by country, label and format. A master cannot be reached from a release id, so no existing tool on this server can return it.",
      inputSchema: z.object( { master_id: z.number().describe("Discogs master release id, like 1660109."), limit: z.number().describe("How many pressings to read, 1 to 100.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await masterRelease(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
