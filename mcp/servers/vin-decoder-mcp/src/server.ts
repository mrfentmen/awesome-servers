import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { decodeVin, makeModelCatalog } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "vin-decoder-mcp", version: "1.0.0" })
  server.registerTool(
    "decode_vin",
    {
      title: "Decode vin",
      description: "Decode a VIN into vehicle details.",
      inputSchema: z.object( { vin: z.string().describe("17 character VIN.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await decodeVin(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "decode_vin_full",
    {
      title: "Decode vin full",
      description: "Full extended NHTSA decode of a VIN: the check digit verdict, how many of the 154 variables carry a value, and every value NHTSA filled in.",
      inputSchema: z.object( { vin: z.string().describe("17 character VIN."), limit: z.number().describe("Max filled variables to print, 1-154.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: decode_vin_full ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_vin_decoder_decode_vin_full", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "vehicle_recalls",
    {
      title: "Vehicle recalls",
      description: "NHTSA safety recall campaigns on file for a make, model and model year: component, summary, consequence, remedy and park-it or over-the-air flags.",
      inputSchema: z.object( { make: z.string().describe("Make, e.g. honda."), model: z.string().describe("Model, e.g. accord."), year: z.string().describe("Four digit model year, e.g. 2020."), limit: z.number().describe("Max campaigns to print, 1-40.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: vehicle_recalls ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_vin_decoder_vehicle_recalls", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "make_model_catalog",
    {
      title: "Make model catalog",
      description: "Search NHTSA's 12,000 entry manufacturer list for a make and list the models NHTSA files against its make id.",
      inputSchema: z.object( { make: z.string().describe("Make name, e.g. Honda."), limit: z.number().describe("Max rows to print, 1-60.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await makeModelCatalog(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "recall_campaign",
    {
      title: "Recall campaign",
      description: "One NHTSA recall campaign in full from its number: the manufacturer, component, report date, units affected, the park-it and over-the-air flags, the summary, consequence, remedy and notes, and every model NHTSA files under it. vehicle_recalls goes the other way, searching by make, model and year.",
      inputSchema: z.object( { campaign: z.string().describe("NHTSA campaign number, e.g. 22V655000."), limit: z.number().describe("Max affected models to list, 1-60.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: recall_campaign ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_vin_decoder_recall_campaign", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "models_in_year",
    {
      title: "Models in a model year",
      description: "The models NHTSA's vehicle product registry files for one make in one model year, with the span of years the registry covers so a short answer can be read against what NHTSA actually holds.",
      inputSchema: z.object( { make: z.string().describe("Make name, e.g. Honda."), modelYear: z.string().describe("Four digit model year, e.g. 2020."), limit: z.number().describe("Max models to list, 1-200.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: models_in_year ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_vin_decoder_models_in_year", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
