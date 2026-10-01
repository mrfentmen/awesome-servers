import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { journal, search, detailedSearch } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "doaj-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search open access articles.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "journal",
    {
      title: "Journal",
      description: "Search journals.",
      inputSchema: z.object( { query: z.string().describe("Journal name."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await journal(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "article_by_doi",
    {
      title: "Article by DOI",
      description: "Look up one open access article by its DOI, with authors, journal, page range, subjects, full text link and abstract.",
      inputSchema: z.object( { doi: z.string().describe("DOI like 10.1186/s12859-021-03972-5, with or without the doi.org prefix.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: article_by_doi ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_doaj_article_by_doi", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "journal_profile",
    {
      title: "Journal profile",
      description: "The full DOAJ record for one journal by ISSN: charges, waiver, licence, copyright, peer review, preservation and how much is indexed.",
      inputSchema: z.object( { issn: z.string().describe("ISSN like 2708-5481.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: journal_profile ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_doaj_journal_profile", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "detailed_search",
    {
      title: "Detailed search",
      description: "Paged and sorted article search with authors, page ranges, subjects, DOI, full text link and an abstract snippet for each hit.",
      inputSchema: z.object( { query: z.string().describe("Search terms, and DOAJ field queries work too like diabetes AND bibjson.year:2020."), sort: z.string().describe("created_date or last_updated, optionally with :asc or :desc.").optional(), page: z.number().describe("Page number, 1-1000. Defaults to 1.").optional(), limit: z.number().describe("Results per page, 1-100, which is DOAJ own cap. Defaults to 10.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await detailedSearch(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
