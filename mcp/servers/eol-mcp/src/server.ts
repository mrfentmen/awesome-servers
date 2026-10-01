import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { page, search } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "eol-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search species.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "page",
    {
      title: "Page",
      description: "Get a species page.",
      inputSchema: z.object( { id: z.number().describe("Taxon id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await page(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "taxon_classifications",
    {
      title: "Taxon classifications",
      description: "Show how each taxonomic authority classifies an EOL taxon, with the separate EOL page id each authority uses, since one scientific name can resolve to several records.",
      inputSchema: z.object( { id: z.number().describe("EOL taxon id, e.g. 1268547.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: taxon_classifications ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_eol_taxon_classifications", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "paged_search",
    {
      title: "Paged species search",
      description: "Page through EOL species search results, reporting the total match count and the common names recorded for each hit, for exploring beyond the first page of matches.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), page: z.number().describe("First page to fetch, 1 based.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: paged_search ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_eol_paged_search", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
