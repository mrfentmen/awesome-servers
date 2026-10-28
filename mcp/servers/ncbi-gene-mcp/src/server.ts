import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { geneRecord, searchGeneRecords, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "ncbi-gene-mcp", version: "1.0.1" })

  server.tool(
    "search_gene_records",
    "Search NCBI Gene by symbol, description or condition, in a chosen organism.",
    {
      term: z.string().min(2).describe('Search term, e.g. "BRCA1[gene] AND human[orgn]"'),
      limit: z.number().int().min(1).max(25).default(10).describe("Records to return")
    },
    async (a) => {
      try {
        return text(await searchGeneRecords(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "gene_record",
    "Full gene record: official name, location, aliases and the GeneRIF-style summary.",
    {
      uid: z.string().regex(/^\d+$/).describe("NCBI Gene uid, e.g. 672 for BRCA1")
    },
    async (a) => {
      try {
        return text(await geneRecord(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
