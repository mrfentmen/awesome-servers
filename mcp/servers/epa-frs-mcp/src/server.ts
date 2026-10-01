import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { byState, facility, programCount } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "epa-frs-mcp", version: "1.0.0" })
  server.registerTool(
    "by_state",
    {
      title: "By state",
      description: "Facilities in a US state.",
      inputSchema: z.object( { state: z.string().describe("Two letter state code like VA."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await byState(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "facility",
    {
      title: "Facility",
      description: "One facility by registry ID.",
      inputSchema: z.object( { registryId: z.string().describe("FRS registry ID.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await facility(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "program_facility_count",
    {
      title: "Program facility count",
      description: "How many facility to programme registrations the EPA holds, for one state or for the whole country, counted by the service itself rather than from fetched rows.",
      inputSchema: z.object( { state: z.string().describe("Two letter state code like VA. Omit to count the whole country.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await programCount(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "program_facilities",
    {
      title: "Program facilities",
      description: "Facility to programme registrations in a state, with the programme name, its own programme id, the registry id and the site type. The by_state tool reads a different table and never says which programmes a facility belongs to.",
      inputSchema: z.object( { state: z.string().describe("Two letter state code like VA."), limit: z.number().describe("How many rows to fetch, 1 to 50.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: program_facilities ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_epa_frs_program_facilities", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
