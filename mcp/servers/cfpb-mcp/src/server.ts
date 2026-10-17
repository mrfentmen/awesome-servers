import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { search } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "cfpb-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search complaints.",
      inputSchema: z.object( { company: z.string().describe("Company name."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "complaint_facets",
    {
      title: "Complaint facets",
      description: "Server side Elasticsearch facet counts for CFPB consumer complaints, by product, state, issue, company, response, timeliness, channel or tag, with share of the matching set.",
      inputSchema: z.object( { search_term: z.string().describe("Free text, e.g. a company name.").optional(), product: z.string().describe("Exact CFPB product name, e.g. Mortgage.").optional(), facet: z.string().describe("product, state, issue, company, company_response, company_public_response, timely, submitted_via or tags.").optional(), limit: z.number().describe("Max buckets per facet.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement facets locally (paywall removed)
    try { return textError("Not yet implemented: facets") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "product_catalogue",
    {
      title: "Product catalogue",
      description: "Every CFPB complaint product category with its live complaint volume and share of the whole corpus.",
      inputSchema: z.object( { limit: z.number().describe("Max categories.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement catalogue locally (paywall removed)
    try { return textError("Not yet implemented: catalogue") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
