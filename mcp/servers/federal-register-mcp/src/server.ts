import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { format, getDocument, listAgencies, searchDocuments, documentCounts } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)

export function createServer() {
  const server = new McpServer({ name: "federal-register-mcp", version: "1.0.0" })
  server.registerTool(
    "search_documents",
    {
      title: "Search documents",
      description: "Search public Federal Register rules, notices, proposed rules, and presidential documents.",
      inputSchema: z.object( {
    term: z.string().max(200).optional(),
    type: z.enum(["RULE", "PRORULE", "NOTICE", "PRESDOCU"]).optional(),
    fromDate: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/).optional(),
    toDate: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/).optional(),
    page: z.number().int().min(1).max(100).default(1),
    perPage: z.number().int().min(1).max(50).default(10),
  }),
      annotations: READ_ONLY,
    },
    async ({ term, type, fromDate, toDate, page, perPage }) => {
    try { return text(format(await searchDocuments(term, type, fromDate, toDate, page, perPage))) } catch (error) { return errorText(error) }
  }
  )
  server.registerTool(
    "get_document",
    {
      title: "Get document",
      description: "Get one Federal Register document by document number.",
      inputSchema: z.object( {
    documentNumber: z.string().min(1).max(80),
  }),
      annotations: READ_ONLY,
    },
    async ({ documentNumber }) => {
    try { return text(format(await getDocument(documentNumber))) } catch (error) { return errorText(error) }
  }
  )
  server.registerTool(
    "list_agencies",
    {
      title: "List agencies",
      description: "List agencies represented in the Federal Register API.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
    try { return text(format(await listAgencies())) } catch (error) { return errorText(error) }
  }
  )
  server.registerTool(
    "comment_periods",
    {
      title: "Comment periods",
      description: "Which Federal Register documents are open for public comment right now and when each comment window closes, which the search tool cannot answer because it does not return the closing date.",
      inputSchema: z.object( { days: z.number().describe("How many days ahead to look, 1-90. Defaults to 7.").optional(), limit: z.number().describe("How many documents to list, 1-50. Defaults to 10.").optional(), type: z.string().describe("Optional type: RULE, PRORULE, NOTICE or PRESDOCU.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement periods locally (paywall removed)
    try { return textError("Not yet implemented: periods") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "document_counts",
    {
      title: "Document counts",
      description: "How many Federal Register documents match a term, broken down by the four real document types, with the API's own match count.",
      inputSchema: z.object( { term: z.string().min(1).max(200).describe("Search term, like bears or emissions.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await documentCounts(args)) } catch (error) { return errorText(error) }
  }
  )

  return server
}
