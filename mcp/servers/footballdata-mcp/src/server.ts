import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatCompetition, FootballDataError, listCompetitions, teamMatches } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "footballdata-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_competitions",
    {
      title: "List competitions",
      description: "Soccer competitions with ids and areas. Known ids: Arsenal 57, Barcelona 81.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const rows = await listCompetitions()
        if (rows.length === 0) return text("No competitions.")
        return text(rows.map((c, i) => formatCompetition(c, i)).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "team_matches",
    {
      title: "Team matches",
      description: "Recent and upcoming matches of one team with scores.",
      inputSchema: z.object({
        team_id: z.string().describe("Numeric team id, e.g. '57' for Arsenal"),
        limit: z.number().int().min(1).max(20).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ team_id, limit }) => {
      try {
        const rows = await teamMatches(team_id, limit)
        if (rows.length === 0) return text(`No matches for team ${team_id}.`)
        return text(rows.map((m, i) => `${i + 1}. ${m}`).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof FootballDataError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
