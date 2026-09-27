import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { avgInterest, cashOps, debtPenny, debtTotal, mtsSpending } from "./api.js"
import { rates } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "treasury-rates-mcp", version: "1.0.0" })
  server.registerTool(
    "rates",
    {
      title: "Rates",
      description: "Treasury FX rates for a currency.",
      inputSchema: z.object( { country: z.string().describe("Country currency like Euro Area.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await rates(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "avg_interest",
    {
      title: "Avg interest",
      description: "Average interest rates on US securities.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await avgInterest(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "debt_total",
    {
      title: "Debt total",
      description: "Monthly statement of the public debt.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await debtTotal(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "mts_spending",
    {
      title: "MTS spending",
      description: "Monthly Treasury outlays by function.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await mtsSpending(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "cash_ops",
    {
      title: "Cash ops",
      description: "Daily deposits and withdrawals.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await cashOps(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "debt_penny",
    {
      title: "Debt penny",
      description: "Total public debt to the penny.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await debtPenny()) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
