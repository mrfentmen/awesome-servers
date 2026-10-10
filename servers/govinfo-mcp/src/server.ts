import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatHit, GovInfoError, listCollections, searchPublished, federalRegisterSearch, federalRegisterDocument, collectionStatistics } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "govinfo-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_collections",
    {
      title: "List collections",
      description: "GovInfo collections: bills, laws, Register, Record, and more.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const rows = await listCollections()
        if (rows.length === 0) return text("No collections.")
        return text(rows.map((c, i) => `${i + 1}. [${c.code}] ${c.name ?? ""}`).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "search_published",
    {
      title: "Search publications",
      description: "Search published U.S. government documents by keyword.",
      inputSchema: z.object({
        query: z.string().describe("Search text, e.g. 'infrastructure', 'climate'"),
        collection: z.string().default("").describe("Collection code like 'BILLS', empty = all (use list_collections)"),
        limit: z.number().int().min(1).max(100).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, collection, limit }) => {
      try {
        const rows = await searchPublished(query, collection, limit)
        if (rows.length === 0) return text(`Nothing found for "${query}".`)
        return text(rows.map((h, i) => formatHit(h, i)).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "federal_register_search",
    {
      title: "Search the Federal Register",
      description: "Search Federal Register rules, proposed rules and notices by keyword, with optional type, agency and publication-date filters.",
      inputSchema: z.object({
        query: z.string().describe("Search text, e.g. 'clean air', 'rail safety'"),
        type: z.string().default("").describe("RULE, PRORULE, NOTICE or empty for all"),
        agency: z.string().default("").describe("Agency name fragment, e.g. 'environmental-protection'"),
        publishedAfter: z.string().default("").describe("Only documents published on or after this YYYY-MM-DD date"),
        limit: z.number().int().min(1).max(20).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, type, agency, publishedAfter, limit }) => {
      // ---- paywall: federal_register_search ----
      const paywallMessage = await premiumRequired("federal_register_search")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try {
        return text(await federalRegisterSearch({ query, type, agency, publishedAfter, limit }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "federal_register_document",
    {
      title: "Get a Federal Register document",
      description: "One Federal Register document by document number: abstract, CFR citations, docket ids, RIN and effective date.",
      inputSchema: z.object({
        documentNumber: z.string().describe("Document number like 2026-19815 (use federal_register_search)"),
      }),
      annotations: READ_ONLY,
    },
    async ({ documentNumber }) => {
      // ---- paywall: federal_register_document ----
      const paywallMessage = await premiumRequired("federal_register_document")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try {
        return text(await federalRegisterDocument({ documentNumber }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "collection_statistics",
    {
      title: "GovInfo corpus size by collection",
      description: "How much each GovInfo collection actually holds: package and granule counts, largest first, optionally filtered by name or code.",
      inputSchema: z.object({
        query: z.string().default("").describe("Name or code fragment, e.g. 'bill', 'federal register'. Empty = all collections"),
        limit: z.number().int().min(1).max(60).default(15),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        return text(await collectionStatistics({ query, limit }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof GovInfoError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
