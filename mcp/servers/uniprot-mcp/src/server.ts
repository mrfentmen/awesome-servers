import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { searchProteins, getEntry } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "uniprot-mcp", version: "1.0.0" })

  server.tool(
    "search_proteins",
    "Search UniProtKB protein records",
    { query: z.string().min(1).describe("UniProt query, e.g. insulin or gene:BRCA1"), limit: z.number().int().min(1).max(50).default(5).describe("How many records") },
    async ({ query, limit }) => {
      try {
        return text(await searchProteins(query, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_entry",
    "Full UniProt record by accession",
    { accession: z.string().min(1).describe("UniProt accession, e.g. P01308") },
    async ({ accession }) => {
      try {
        return text(await getEntry(accession))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
