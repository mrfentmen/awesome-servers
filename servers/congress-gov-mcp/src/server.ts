import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { billActions, billDetails, billSummaries, bills, committeeDetails, committees, memberDetails, members } from "./api.js"
import { search } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "congress-gov-mcp", version: "1.0.0" })
  server.registerTool(
    "bills",
    {
      title: "Bills",
      description: "Recent bills in Congress.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await bills(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search bills by text.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "bill_details",
    {
      title: "Bill details",
      description: "Title, sponsors and latest action for one bill.",
      inputSchema: z.object( { congress: z.string().describe("Congress like 118.").optional(), type: z.string().describe("Bill type like hr.").optional(), number: z.string().describe("Bill number.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await billDetails(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "bill_actions",
    {
      title: "Bill actions",
      description: "Action history for one bill.",
      inputSchema: z.object( { congress: z.string().describe("Congress like 118.").optional(), type: z.string().describe("Bill type like hr.").optional(), number: z.string().describe("Bill number.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await billActions(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "members",
    {
      title: "Members",
      description: "Members of Congress. Set CONGRESS_API_KEY to avoid DEMO_KEY limits.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await members(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "member_details",
    {
      title: "Member details",
      description: "Member profile and terms by Bioguide ID.",
      inputSchema: z.object( { bioguideId: z.string().describe("Bioguide ID like P000197.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await memberDetails(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "committees",
    {
      title: "Committees",
      description: "Congressional committees.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await committees(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "committee_details",
    {
      title: "Committee details",
      description: "One committee by chamber and code.",
      inputSchema: z.object( { chamber: z.string().describe("house or senate.").optional(), code: z.string().describe("System code like hsag00.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await committeeDetails(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "bill_summaries",
    {
      title: "Bill summaries",
      description: "Summaries for one bill.",
      inputSchema: z.object( { congress: z.string().describe("Congress like 118.").optional(), type: z.string().describe("Bill type like hr.").optional(), number: z.string().describe("Bill number.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await billSummaries(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
