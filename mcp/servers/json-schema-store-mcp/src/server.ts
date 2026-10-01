import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { search, schema_versions } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "json-schema-store-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search schemas in the catalog.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "match_filename",
    {
      title: "Match a file name",
      description: "Find the Schema Store schemas that claim a given file name or path, using the fileMatch globs the catalog carries on 1,348 of its entries, which is how Schema Store is meant to be used. Matches the pattern against both the full path and the bare file name, reports which pattern matched, and warns when more than one schema claims the full path. The existing search tool matches a query against names and descriptions, so it cannot answer which schema belongs to a file at all.",
      inputSchema: z.object({
        path: z.string().min(1).max(400).describe("File name or path, e.g. '.github/workflows/ci.yml' or 'tsconfig.json'."),
        limit: z.number().int().min(1).max(25).optional().describe("How many matches to show. Default 10."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: match_filename ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_json_schema_store_match_filename", args)) } catch (e) { return textError(error(e)) }
    }
  )

  server.registerTool(
    "schema_versions",
    {
      title: "Schema versions",
      description: "Show the upstream versions a named schema is pinned to, with each version's URL, the file names it claims, and whether the current url is one of the pinned versions or something separate. Reports plainly when a schema pins no versions, so its address can change without notice. The existing search tool prints a name and a description and nothing else.",
      inputSchema: z.object({
        name: z.string().min(1).describe("Schema name as the store lists it, e.g. 'Ameba' or 'GitHub Action'."),
      }),
      annotations: READ_ONLY,
    },
    async ({ name }) => {
      try { return text(await schema_versions({ name })) } catch (e) { return textError(error(e)) }
    }
  )

  server.registerTool(
    "catalog_census",
    {
      title: "Catalog census",
      description: "Report the shape of the whole Schema Store catalog rather than a slice of it: how many schemas it holds, how many carry a description and a usable url, how many claim file names and how many patterns that is, how many pin upstream versions, which hosts serve the store and what share of it the largest provides, how the names are shaped and therefore what a caller has to type, and whether any name is duplicated. The existing search tool slices the catalog to 500 entries and reports none of this.",
      inputSchema: z.object({
        limit: z.number().int().min(5).max(40).optional().describe("How many hosts to list. Default 15."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: catalog_census ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_json_schema_store_catalog_census", args)) } catch (e) { return textError(error(e)) }
    }
  )

  server.registerTool(
    "schema_digest",
    {
      title: "Schema digest",
      description: "Open a Schema Store schema document and report what it asserts: dialect, size, root properties, named subschemas and how often each constraining keyword appears.",
      inputSchema: z.object( { name: z.string().describe("Schema name from the store, e.g. tsconfig.json.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: schema_digest ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_json_schema_store_schema_digest", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "schema_refs",
    {
      title: "Schema references",
      description: "Every $ref a Schema Store schema document makes, grouped by target and listing the external files it depends on. The catalog index carries no references, so this is only readable from the document itself.",
      inputSchema: z.object( { name: z.string().describe("Schema name from the store, e.g. tsconfig.json.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: schema_refs ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_json_schema_store_schema_refs", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
