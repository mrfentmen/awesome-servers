import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { bills, search, committees } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "govtrack-mcp", version: "1.0.0" })
  server.registerTool(
    "bills",
    {
      title: "Bills",
      description: "Recent US bills.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await bills(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search US bills.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "members",
    {
      title: "Members",
      description: "Members of Congress from GovTrack's role records: who holds which seat, party, state, district, term dates and leadership title.",
      inputSchema: z.object( { current: z.boolean().default(true), congress: z.number().int().min(1).max(999).optional(), party: z.string().max(40).optional(), limit: z.number().int().min(1).max(50).default(15) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement members locally (paywall removed)
    try { return textError("Not yet implemented: members") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "votes",
    {
      title: "Votes",
      description: "Recorded congressional votes from GovTrack: chamber, congress, date, question text, result and the plus/minus/other totals.",
      inputSchema: z.object( { congress: z.number().int().min(1).max(999).optional(), chamber: z.enum(["house", "senate", "joint"]).optional(), limit: z.number().int().min(1).max(50).default(10) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement votes locally (paywall removed)
    try { return textError("Not yet implemented: votes") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "committees",
    {
      title: "Committees",
      description: "Congressional committees and subcommittees from GovTrack with their code, chamber and jurisdiction.",
      inputSchema: z.object( { committeeType: z.enum(["house", "senate", "joint"]).optional(), limit: z.number().int().min(1).max(50).default(10) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await committees(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
