import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { random } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "fox-mcp", version: "1.0.0" })
  server.registerTool(
    "random",
    {
      title: "Random",
      description: "A random fox photo.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await random(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "fox_species",
    {
      title: "Fox species",
      description: "Search the GBIF taxonomic backbone for species matching a name, with family, genus, order and GBIF taxon key.",
      inputSchema: z.object( { query: z.string().describe("Scientific or genus name, e.g. Vulpes.").optional(), limit: z.number().int().min(1).max(25).default(10).describe("Max results.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: fox_species ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_fox_fox_species", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "fox_sightings",
    {
      title: "Fox sightings",
      description: "Recent GBIF occurrence records for a fox species: where and when it was recorded, and how the record was made.",
      inputSchema: z.object( { scientific_name: z.string().describe("Scientific name, e.g. Vulpes vulpes.").optional(), limit: z.number().int().min(1).max(20).default(8).describe("Max records.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: fox_sightings ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_fox_fox_sightings", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
