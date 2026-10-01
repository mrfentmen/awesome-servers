import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { get, query } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "myvariant-mcp", version: "1.0.0" })
  server.registerTool(
    "query",
    {
      title: "Query",
      description: "Query variants.",
      inputSchema: z.object( { q: z.string().describe("Variant query (e.g. chr7:g.140453136A>T)."), size: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await query(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "get",
    {
      title: "Get",
      description: "Get a variant by id.",
      inputSchema: z.object( { id: z.string().describe("Variant id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await get(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "variant_fields",
    {
      title: "Variant fields",
      description: "Run a MyVariant query projected down to the fields you name - gene symbol, gnomad frequency, ClinVar calls - instead of a full record per hit.",
      inputSchema: z.object( { q: z.string().describe("MyVariant query, e.g. dbnsfp.genename:BRCA1."), fields: z.string().describe("Comma-separated fields to project, max 20.").optional(), size: z.number().describe("Max hits.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: variant_fields ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_myvariant_variant_fields", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
