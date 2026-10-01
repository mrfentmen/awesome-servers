import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { drivers, races } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "openf1-mcp", version: "1.0.0" })
  server.registerTool(
    "races",
    {
      title: "Races",
      description: "List races for a season.",
      inputSchema: z.object( { year: z.number().describe("Season year.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await races(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "drivers",
    {
      title: "Drivers",
      description: "List drivers for a session.",
      inputSchema: z.object( { session: z.number().describe("Session key.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await drivers(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "session_list",
    {
      title: "Session list",
      description: "List the sessions in an F1 race weekend from OpenF1: practice, qualifying and race, with session keys, start and end times, circuit and cancelled flag.",
      inputSchema: z.object({ meeting_key: z.number().describe("Race weekend key, from the races tool."), }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: session_list ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_openf1_session_list", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "tyre_stints",
    {
      title: "Tyre stints",
      description: "Tyre stints in an OpenF1 session: compound, stint number, lap range and starting tyre age, per driver.",
      inputSchema: z.object({ session: z.number().describe("Session key, from session_list."), driver_number: z.number().describe("Limit to one driver number.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: tyre_stints ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_openf1_tyre_stints", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "fastest_laps",
    {
      title: "Fastest laps",
      description: "Each driver's fastest lap in an OpenF1 session, with sector times and top speed.",
      inputSchema: z.object({ session: z.number().describe("Session key, from session_list."), limit: z.number().describe("Max drivers, 1-25, default 10.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: fastest_laps ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_openf1_fastest_laps", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
