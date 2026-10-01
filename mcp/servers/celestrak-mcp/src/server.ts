import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { group, satellite, nameSearch } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "celestrak-mcp", version: "1.0.0" })
  server.registerTool(
    "group",
    {
      title: "Group",
      description: "Satellites in a named group.",
      inputSchema: z.object( { group: z.string().describe("Group like stations, visual, or active.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await group(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "satellite",
    {
      title: "Satellite",
      description: "One satellite by NORAD catalog number.",
      inputSchema: z.object( { noradId: z.number().describe("NORAD catalog number.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await satellite(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "satellite_catalogue",
    {
      title: "Satellite catalogue",
      description: "CelesTrak catalogue records for a group: owner, launch date and site, decay date, period and apogee/perigee.",
      inputSchema: z.object( { group: z.string().describe("CelesTrak group, e.g. stations or starlink.").optional(), limit: z.number().describe("Max records.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: satellite_catalogue ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_celestrak_satellite_catalogue", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "name_search",
    {
      title: "Name search",
      description: "Find satellites in a CelesTrak group whose name contains a fragment, with their orbital elements.",
      inputSchema: z.object( { query: z.string().describe("Name fragment, e.g. noaa or GPS."), group: z.string().describe("CelesTrak group.").optional(), limit: z.number().describe("Max matches.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await nameSearch(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "orbit_summary",
    {
      title: "Orbit summary",
      description: "Aggregate orbital picture of a CelesTrak group: inclination and period ranges, plus LEO, MEO and GEO counts.",
      inputSchema: z.object( { group: z.string().describe("CelesTrak group.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: orbit_summary ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_celestrak_orbit_summary", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
