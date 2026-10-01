import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { occurrences, taxa } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "pbdb-mcp", version: "1.0.0" })
  server.registerTool(
    "occurrences",
    {
      title: "Occurrences",
      description: "Fossil occurrences for a taxon.",
      inputSchema: z.object( { taxon: z.string().describe("Taxon name like Triceratops."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await occurrences(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "taxa",
    {
      title: "Taxa",
      description: "Information about a taxon.",
      inputSchema: z.object( { name: z.string().describe("Taxon name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await taxa(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "taxon_ancestry",
    {
      title: "Taxon ancestry",
      description: "A taxon's full parent chain from the Paleobiology Database with rank and class, which the occurrence and taxa lookups never walk.",
      inputSchema: z.object( { name: z.string().describe("Taxon name, e.g. Canis."), limit: z.number().describe("Max records.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: taxon_ancestry ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_pbdb_taxon_ancestry", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "occurrence_list",
    {
      title: "Occurrence list",
      description: "A taxon's fossil occurrences from the Paleobiology Database with age, class and optionally collection, continent and country, which the occurrence tool cannot filter by name.",
      inputSchema: z.object( { name: z.string().describe("Taxon name, e.g. Tyrannosaurus."), limit: z.number().describe("Max occurrences.").optional(), showLoc: z.boolean().describe("Include collection and location.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: occurrence_list ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_pbdb_occurrence_list", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
