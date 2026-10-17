import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { record, search, usageRights } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "digitalnz-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search records.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "record",
    {
      title: "Record",
      description: "Get a record by id.",
      inputSchema: z.object( { id: z.string().describe("Record id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await record(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "filtered_search",
    {
      title: "Filtered search",
      description: "Search DigitalNZ with category, decade, year, language, content partner and usage filters, paging and sorting. The existing search passes text alone.",
      inputSchema: z.object( { query: z.string().describe("Search terms. Omit to browse everything.").optional(), category: z.string().describe("Exact category like Images, Newspapers or Archives.").optional(), decade: z.string().describe("Decade like 1900.").optional(), year: z.number().describe("Exact year like 1910.").optional(), language: z.string().describe("Language code like en or mi.").optional(), partner: z.string().describe("Exact content partner name, for example Museum of New Zealand Te Papa Tongarewa.").optional(), usage: z.string().describe("Share, Modify or Use commercially.").optional(), sort: z.string().describe("date or syndication_date. Any other value makes DigitalNZ fail.").optional(), page: z.number().describe("Page number, 1-1000. Defaults to 1.").optional(), limit: z.number().describe("Results per page, 1-100. Defaults to 10.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement search locally (paywall removed)
    try { return textError("Not yet implemented: search") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "similar_records",
    {
      title: "Similar records",
      description: "Records DigitalNZ considers similar to one record, using its own more_like_this route.",
      inputSchema: z.object( { id: z.string().describe("Record id."), limit: z.number().describe("How many to list, 1-100. Defaults to 10.").optional(), page: z.number().describe("Page number, 1-1000. Defaults to 1.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement records locally (paywall removed)
    try { return textError("Not yet implemented: records") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "usage_rights",
    {
      title: "Usage rights",
      description: "What a DigitalNZ record may be used for: rights statement, licence link, allowed usage, copyright and commercial use.",
      inputSchema: z.object( { id: z.string().describe("Record id.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await usageRights(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
