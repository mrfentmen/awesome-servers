import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { vehicleMpg, modelsForMake } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "fuel-economy-mcp", version: "1.0.0" })
  server.registerTool(
    "vehicle_mpg",
    {
      title: "Vehicle mpg",
      description: "Get fuel economy for a make, model, and year.",
      inputSchema: z.object( { make: z.string().describe("Make like Honda."), model: z.string().describe("Model like Civic."), year: z.number().describe("Model year.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await vehicleMpg(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "makes_for_year",
    {
      title: "Makes for year",
      description: "List the vehicle makes the EPA fuel economy database covers for a given model year.",
      inputSchema: z.object( { year: z.number().describe("Model year, 1984 onwards."), limit: z.number().int().min(1).max(100).default(25).describe("Max makes.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: makes_for_year ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_fuel_economy_makes_for_year", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "models_for_make",
    {
      title: "Models for make",
      description: "List the models the EPA fuel economy database has for a make in a given model year.",
      inputSchema: z.object( { year: z.number().describe("Model year, 1984 onwards."), make: z.string().describe("Make, e.g. Toyota."), limit: z.number().int().min(1).max(100).default(25).describe("Max models.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await modelsForMake(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "vehicle_data",
    {
      title: "Vehicle data",
      description: "The full EPA record for one vehicle id: class, powertrain, transmission, fuel economy, range, SmartWay score and fuel cost saving.",
      inputSchema: z.object( { id: z.string().describe("Numeric EPA vehicle id, e.g. 31724.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: vehicle_data ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_fuel_economy_vehicle_data", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
