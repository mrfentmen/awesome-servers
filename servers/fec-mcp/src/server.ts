import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { candidateTotals, candidates, committees, elections, filings, scheduleA, scheduleB } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "fec-mcp", version: "1.0.0" })
  server.registerTool(
    "candidates",
    {
      title: "Candidates",
      description: "Search federal candidates.",
      inputSchema: z.object( { query: z.string().describe("Candidate name."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await candidates(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "committees",
    {
      title: "Committees",
      description: "Search federal committees. Uses FEC_API_KEY if set, else rate-limited DEMO_KEY.",
      inputSchema: z.object( { query: z.string().describe("Committee name."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await committees(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "filings",
    {
      title: "Filings",
      description: "Campaign finance filings, optionally for a committee.",
      inputSchema: z.object( { committeeId: z.string().describe("Committee id like C00684373.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await filings(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "schedule_a",
    {
      title: "Itemized receipts",
      description: "Who gave money (Schedule A).",
      inputSchema: z.object( { committeeId: z.string().describe("Committee id.").optional(), cycle: z.string().describe("Cycle like 2024.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await scheduleA(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "schedule_b",
    {
      title: "Disbursements",
      description: "How committees spent money (Schedule B).",
      inputSchema: z.object( { committeeId: z.string().describe("Committee id.").optional(), cycle: z.string().describe("Cycle like 2024.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await scheduleB(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "candidate_totals",
    {
      title: "Candidate totals",
      description: "Raised, spent, cash and debt per candidate.",
      inputSchema: z.object( { candidateId: z.string().describe("Candidate id.").optional(), cycle: z.string().describe("Cycle like 2024.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await candidateTotals(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "elections",
    {
      title: "Elections",
      description: "Election results by cycle and office.",
      inputSchema: z.object( { cycle: z.string().describe("Cycle like 2024.").optional(), office: z.string().describe("president, senate or house.").optional(), state: z.string().describe("State code.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await elections(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
