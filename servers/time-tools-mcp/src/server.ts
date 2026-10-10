import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { dateDiff, fromTimestamp, now } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "time-tools-mcp", version: "1.0.0" })
  server.registerTool(
    "now",
    {
      title: "Now",
      description: "Current time in several formats.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await now(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "from_timestamp",
    {
      title: "From timestamp",
      description: "Convert a unix timestamp to a date.",
      inputSchema: z.object( { timestamp: z.number().describe("Unix seconds.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await fromTimestamp(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "date_diff",
    {
      title: "Date diff",
      description: "Days between two dates.",
      inputSchema: z.object( { start: z.string().describe("Start date YYYY-MM-DD."), end: z.string().describe("End date YYYY-MM-DD.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await dateDiff(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "week_info",
    {
      title: "Week info",
      description: "The calendar facts about one date: ISO 8601 week number and week year, day of year, days left in the year, quarter and weekday. Pure computation, no network.",
      inputSchema: z.object( { date: z.string().describe("A date as YYYY-MM-DD, or a unix timestamp in seconds. Omit for today.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: week_info ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_time_tools_week_info", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "add_duration",
    {
      title: "Add duration",
      description: "Add an ISO 8601 duration to a date or timestamp, with the calendar parts applied before the fixed width ones so month lengths are respected. Pure computation, no network.",
      inputSchema: z.object( { start: z.string().describe("A date as YYYY-MM-DD, or a unix timestamp in seconds."), duration: z.string().describe("An ISO 8601 duration, like P1M, P2W, PT90M, P1Y2M3DT4H5M6S.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: add_duration ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_time_tools_add_duration", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
