import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { lookup, random } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "postcodes-mcp", version: "1.0.0" })
  server.registerTool(
    "lookup",
    {
      title: "Lookup",
      description: "Look up a postcode.",
      inputSchema: z.object( { postcode: z.string().describe("UK postcode.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await lookup(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "random",
    {
      title: "Random",
      description: "Get a random postcode.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await random(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "area_profile",
    {
      title: "Area profile",
      description: "Every administrative, health and electoral layer a postcode sits in: nation, region, district, county, ward, parish, built-up area, parliamentary constituency before and after 2024, police force, NHS health authority, integrated care board, commissioning group, super output areas, NUTS region, and its introduction and termination dates.",
      inputSchema: z.object( { postcode: z.string().describe("UK postcode.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: area_profile ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_postcodes_area_profile", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "nearest_postcodes",
    {
      title: "Nearest postcodes",
      description: "The postcodes around one point with the real great-circle distance to each, the districts they fall in and the mean distance across them.",
      inputSchema: z.object( { postcode: z.string().describe("UK postcode."), limit: z.number().describe("Max neighbours to print, 1-20.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: nearest_postcodes ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_postcodes_nearest_postcodes", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
