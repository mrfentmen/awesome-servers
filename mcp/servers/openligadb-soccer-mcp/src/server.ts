import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { matches, leagues } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "openligadb-soccer-mcp", version: "1.0.0" })
  server.registerTool(
    "matches",
    {
      title: "Matches",
      description: "Matches for a league and season.",
      inputSchema: z.object( { league: z.string().describe("League like bl1.").optional(), season: z.number().describe("Season year.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await matches(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "top_scorers",
    {
      title: "Top scorers",
      description: "Top goal scorers for a league and season.",
      inputSchema: z.object( { league: z.string().describe("League like bl1.").optional(), season: z.number().describe("Season year.").optional(), limit: z.number().describe("Max scorers.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement scorers locally (paywall removed)
    try { return textError("Not yet implemented: scorers") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "leagues",
    {
      title: "Leagues",
      description: "Available OpenLigaDB league shortcuts, seasons and names.",
      inputSchema: z.object( { limit: z.number().describe("Max leagues.").optional(), sport: z.string().describe("Filter by sport name substring.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await leagues(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
