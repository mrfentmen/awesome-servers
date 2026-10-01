import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { article, search, searchPage } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "europepmc-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search Europe PMC articles.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "article",
    {
      title: "Article",
      description: "One article by ID and source.",
      inputSchema: z.object( { extId: z.string().describe("Article ID like 32534363."), source: z.string().describe("Source like MED or PMC.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await article(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "search_page",
    {
      title: "Search page",
      description: "Walk a Europe PMC search past the first page with a cursor, optionally sorted by citation count or date.",
      inputSchema: z.object( { query: z.string().describe("Europe PMC query, e.g. covid AND open_access:y."), limit: z.number().describe("Results per page, 1-100. Defaults to 25.").optional(), sort: z.string().describe("CITED desc, P_PDATE_D desc or PUB_YEAR desc. Defaults to relevance.").optional(), cursor: z.string().describe("The cursor from the previous page. Leave empty for the first page.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await searchPage(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "citations",
    {
      title: "Citations",
      description: "The papers that cite one article, with authors, journal and year, and paging.",
      inputSchema: z.object( { id: z.string().describe("Article id, like 31986264."), source: z.string().describe("MED or PPR. Inferred from the id when left out.").optional(), limit: z.number().describe("Results per page, 1-100. Defaults to 25.").optional(), page: z.number().describe("Page number, starting at 1.").optional(), sort: z.string().describe("Optional sort, CITED desc, P_PDATE_D desc or PUB_YEAR desc.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: citations ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_europepmc_citations", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "references",
    {
      title: "References",
      description: "The papers one article cites, with authors, journal and year, and paging.",
      inputSchema: z.object( { id: z.string().describe("Article id, like 31986264."), source: z.string().describe("MED or PPR. Inferred from the id when left out.").optional(), limit: z.number().describe("Results per page, 1-100. Defaults to 25.").optional(), page: z.number().describe("Page number, starting at 1.").optional(), sort: z.string().describe("Optional sort, CITED desc, P_PDATE_D desc or PUB_YEAR desc.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: references ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_europepmc_references", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
