import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { failures, financials, history, institutions } from "./api.js"
import { largestBanks } from "./api.js"
import { locations } from "./api.js"
import { summary } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "fdic-mcp", version: "1.0.0" })
  server.registerTool(
    "search_institutions",
    {
      title: "Search institutions",
      description: "Search FDIC insured institutions by name.",
      inputSchema: z.object( { name: z.string().describe("Bank name."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await institutions(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "get_largest_banks",
    {
      title: "Get largest banks",
      description: "Get the largest FDIC insured institutions by assets.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await largestBanks(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "bank_failures",
    {
      title: "Bank failures",
      description: "Failed banks, most recent first.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await failures(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "bank_history",
    {
      title: "Bank history",
      description: "Charter and history events.",
      inputSchema: z.object( { name: z.string().describe("Bank name.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await history(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "bank_locations",
    {
      title: "Bank locations",
      description: "Branches by city and state.",
      inputSchema: z.object( { city: z.string().describe("City.").optional(), state: z.string().describe("State name.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await locations(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "bank_financials",
    {
      title: "Bank financials",
      description: "Call-report financials: assets, deposits, equity, income.",
      inputSchema: z.object( { name: z.string().describe("Bank name.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await financials(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "fdic_summary",
    {
      title: "FDIC summary",
      description: "Industry totals.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await summary()) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
