import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { candidateSummary, formatCandidate, OpenSecretsError, searchCandidates, fecCandidateSearch, fecCommitteeSearch } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "opensecrets-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_candidates",
    {
      title: "Search candidates",
      description: "Find federal candidates by name fragment: party, state, chamber, CRP id.",
      inputSchema: z.object({
        query: z.string().describe("Name fragment, e.g. 'Smith'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ query }) => {
      try {
        const rows = await searchCandidates(query)
        if (rows.length === 0) return text(`No candidates match "${query}".`)
        return text(rows.map((c, i) => formatCandidate(c, i)).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "candidate_summary",
    {
      title: "Money summary",
      description: "Raised, spent, cash on hand and debt for one candidate and cycle.",
      inputSchema: z.object({
        cid: z.string().describe("CRP candidate id, e.g. 'N00007360' (use search_candidates)"),
        cycle: z.string().default("2024").describe("Election cycle, e.g. '2024'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ cid, cycle }) => {
      try {
        return text(await candidateSummary(cid, cycle))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "fec_candidate_search",
    {
      title: "Search the FEC candidate index",
      description: "Federal campaign-finance candidate index by name fragment, with office, state and party filters, plus each candidate's principal committees and cycle history.",
      inputSchema: z.object({
        query: z.string().describe("Name fragment, e.g. 'Sanders'"),
        office: z.string().default("").describe("Office code: H for House, S for Senate, P for President, empty = all"),
        state: z.string().default("").describe("Two-letter state or 'US', empty = all"),
        party: z.string().default("").describe("DEM, REP, IND or empty = all"),
        limit: z.number().int().min(1).max(20).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, office, state, party, limit }) => {
      try {
        return text(await fecCandidateSearch({ query, office, state, party, limit }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "fec_committee_search",
    {
      title: "Search the FEC committee index",
      description: "Federal campaign committees by name keyword: type, designation, party, treasurer, filing frequency, cycle span and sponsored candidates.",
      inputSchema: z.object({
        query: z.string().describe("Committee name fragment, e.g. 'for Senate'"),
        limit: z.number().int().min(1).max(20).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        return text(await fecCommitteeSearch({ query, limit }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof OpenSecretsError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
