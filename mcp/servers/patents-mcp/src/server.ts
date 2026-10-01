import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { searchPatents } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "patents-mcp", version: "1.0.0" })
  server.registerTool(
    "search_patents",
    {
      title: "Search patents",
      description: "Search patents by keyword.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await searchPatents(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "patent_details",
    {
      title: "Patent details",
      description: "Full record for one patent from its Google Patents page: title, abstract, status, dates, application number, inventors, assignees and PDF link.",
      inputSchema: z.object({ number: z.string().describe("Patent number like US7654541B2."), }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: patent_details ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_patents_patent_details", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "patent_citations",
    {
      title: "Patent citations",
      description: "Citation tables for one patent: later patents that cite it, and the earlier patents it cites, each with priority date, publication date, assignee and title.",
      inputSchema: z.object({ number: z.string().describe("Patent number like US7654541B2."), limit: z.number().describe("Max rows per table, 1-40, default 10.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: patent_citations ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_patents_patent_citations", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
