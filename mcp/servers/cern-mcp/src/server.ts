import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { CernError, formatRecord, getRecord, searchRecords } from "./api.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "cern-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_records",
    {
      title: "Search records",
      description: "Search CERN Open Data: datasets, software, news, glossary.",
      inputSchema: z.object({
        query: z.string().describe("Search text, e.g. 'Higgs', 'CMS muon', 'ROOT'"),
        type: z.string().default("").describe("Filter: Dataset, Software, News, Glossary (empty = all)"),
        limit: z.number().int().min(1).max(50).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, type, limit }) => {
      try {
        if (!query.trim()) return textError("Error: query is empty.")
        const rows = await searchRecords(query, type, limit)
        if (rows.length === 0) return text(`No CERN records for "${query}".`)
        return text(rows.map((r, i) => formatRecord(r, i)).join("\n"))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "get_record",
    {
      title: "Get record",
      description: "One CERN record: abstract, type, files, link.",
      inputSchema: z.object({
        id: z.string().describe("Numeric record id (use search_records)"),
      }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        return text(await getRecord(id))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "record_files",
    {
      title: "Record files",
      description: "The files inside a CERN Open Data record, with their type, size and checksum, read from the record's own file bucket.",
      inputSchema: z.object( { id: z.number().describe("CERN record id, e.g. 60."), limit: z.number().describe("Max files.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement files locally (paywall removed)
    try { return textError("Not yet implemented: files") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof CernError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
