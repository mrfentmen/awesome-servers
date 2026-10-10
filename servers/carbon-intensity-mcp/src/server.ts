import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { forecast, intensity, regional, nationalFuelMix } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "carbon-intensity-mcp", version: "1.0.0" })
  server.registerTool(
    "intensity",
    {
      title: "Intensity",
      description: "Current UK grid carbon intensity.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await intensity(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "forecast",
    {
      title: "Forecast",
      description: "Carbon intensity forecast for the next 48 hours.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await forecast(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "regional",
    {
      title: "Regional",
      description: "Carbon intensity by region.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await regional(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "regional_generation_mix",
    {
      title: "Regional generation mix",
      description: "Show the live generation mix behind every UK DNO region, ranking by carbon intensity or by the share of a chosen fuel such as coal, gas, nuclear or wind.",
      inputSchema: z.object( { fuel: z.string().describe("Rank by this fuel, e.g. coal or wind.").optional(), limit: z.number().describe("Max regions.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: regional_generation_mix ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_carbon_intensity_regional_generation_mix", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "national_fuel_mix",
    {
      title: "National fuel mix",
      description: "The UK national generation mix by fuel in percentage terms, split into renewable, fossil, nuclear and import shares, falling back to a regional roll up when the national endpoint omits the mix.",
      inputSchema: z.object( { fuel: z.string().describe("Highlight one fuel.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await nationalFuelMix(args)) } catch (e) { return textError(e instanceof Error ? `Error: ${e.message}` : String(e)) }
  }
  )

  server.registerTool(
    "cleanest_window",
    {
      title: "Cleanest window",
      description: "Scan the UK carbon intensity forecast and report the cleanest and dirtiest half hour slots in the window, the spread between them and the five best times to run flexible load.",
      inputSchema: z.object( { hours: z.number().describe("Hours ahead, up to 48.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: cleanest_window ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_carbon_intensity_cleanest_window", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
