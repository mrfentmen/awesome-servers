import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { doi, search, prefixDetails } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "datacite-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search DOIs by query.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "doi",
    {
      title: "Doi",
      description: "Details for one DOI.",
      inputSchema: z.object( { doi: z.string().describe("DOI like 10.5281/zenodo.20501604.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await doi(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "doi_metadata",
    {
      title: "DOI metadata",
      description: "Full DataCite record for one DOI: creators with affiliations and ORCIDs, contributors, subjects, container title, rights, related identifiers, geo locations, funding awards, formats and state.",
      inputSchema: z.object( { doi: z.string().describe("Full DOI, e.g. 10.5281/zenodo.23003105.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: doi_metadata ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_datacite_doi_metadata", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "creator_dois",
    {
      title: "Creator DOIs",
      description: "Find every DOI in DataCite that lists a given creator, with publisher and year breakdowns across the returned page.",
      inputSchema: z.object( { creator: z.string().describe("Creator name, e.g. Seagal."), limit: z.number().describe("Max DOIs.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: creator_dois ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_datacite_creator_dois", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "prefix_details",
    {
      title: "Prefix details",
      description: "DataCite registration details for a DOI prefix including its member clients, plus the most recent DOIs registered under that prefix.",
      inputSchema: z.object( { prefix: z.string().describe("Bare prefix, e.g. 10.5281."), limit: z.number().describe("Max DOIs.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await prefixDetails(args)) } catch (e) { return textError(e instanceof Error ? `Error: ${e.message}` : String(e)) }
  }
  )

  return server
}
