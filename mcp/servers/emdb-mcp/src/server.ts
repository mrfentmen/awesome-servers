import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { entryDetail, entryPdbs, searchEntries, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "emdb-mcp", version: "1.0.0" })

  server.tool(
    "search_entries",
    "Search EMDB cryo-EM entries by free text (title, authors, sample).",
    {
      query: z.string().min(2).describe("Search text, e.g. ribosome or spike protein"),
      limit: z.number().int().min(1).max(25).default(10).describe("Entries to return")
    },
    async (a) => {
      try {
        return text(await searchEntries(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  server.tool(
    "entry_detail",
    "One EMDB entry: title, resolution, method, authors, deposition date and the primary citation.",
    {
      emdbId: z.string().min(3).describe("EMDB accession, e.g. EMD-1001")
    },
    async (a) => {
      try {
        return text(await entryDetail(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  server.tool(
    "entry_pdbs",
    "The PDB cross-references attached to an EMDB entry, from the entry record.",
    {
      emdbId: z.string().min(3).describe("EMDB accession, e.g. EMD-1001")
    },
    async (a) => {
      try {
        return text(await entryPdbs(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  return server
}
