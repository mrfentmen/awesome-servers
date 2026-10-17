import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { m0_history, m0_latest, m1_convert, m1_latest } from "./api.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'frankfurter-mcp', version: '1.0.0' })
server.registerTool(
    "latest",
    {
      title: "Latest",
      description: "Latest conversion rates.",
      inputSchema: z.object( { from: z.string().describe("Base currency.").optional(), to: z.string().describe("Target currency.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_latest(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "history",
    {
      title: "History",
      description: "Rate history for a period.",
      inputSchema: z.object( { from: z.string().describe("Base currency."), to: z.string().describe("Target currency."), start: z.string().describe("Start date YYYY-MM-DD."), end: z.string().describe("End date YYYY-MM-DD.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_history(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "convert",
    {
      title: "Convert",
      description: "Convert an amount between currencies.",
      inputSchema: z.object( { amount: z.number().describe("Amount to convert."), from: z.string().describe("Source currency.").optional(), to: z.string().describe("Target currency.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_convert(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "supported_currencies",
    {
      title: "Supported currencies",
      description: "Every currency Frankfurter quotes with its name, or - given a base code - that base's current rate against each currency it tracks.",
      inputSchema: z.object( { base: z.string().describe("Base code such as EUR to list its rates.").optional(), symbol: z.string().describe("Filter the list to one code or name.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement currencies locally (paywall removed)
    try { return textError("Not yet implemented: currencies") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
