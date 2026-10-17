import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { formatHit, formatMember, getMember, ParliamentError, searchMembers } from "./api.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "ukparliament-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_members",
    {
      title: "Search members",
      description: "Search UK Parliament members (MPs and Lords) by name: party, constituency.",
      inputSchema: z.object({
        name: z.string().describe("Name to search, e.g. 'boris'"),
        limit: z.number().int().min(1).max(20).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ name, limit }) => {
      try {
        const results = await searchMembers(name, limit)
        if (results.length === 0) return text(`No UK Parliament members match "${name}".`)
        return text(`UK Parliament members for "${name}":\n\n${results.map((h, i) => formatHit(h, i)).join("\n")}`)
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "get_member",
    {
      title: "Get member details",
      description: "Get a UK Parliament member by id: party, constituency, house, status.",
      inputSchema: z.object({
        id: z.string().describe("Numeric member id, e.g. '1423' (use search_members to find it)"),
      }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        const m = await getMember(id)
        if (!m) return text(`No UK Parliament member with id ${id}.`)
        return text(formatMember(m))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "member_career",
    {
      title: "Member career",
      description: "A UK Parliament member's full record: who they are, every constituency they have represented, their government and opposition posts, and their committee memberships.",
      inputSchema: z.object( { id: z.string().describe("Numeric member id, e.g. 4380.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement career locally (paywall removed)
    try { return textError("Not yet implemented: career") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof ParliamentError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
