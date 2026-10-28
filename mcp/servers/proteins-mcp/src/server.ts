import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { proteinFeatures, proteinRecord, proteinsByTaxon, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "proteins-mcp", version: "1.0.0" })

  server.tool(
    "protein_record",
    "Full protein record by UniProt accession.",
    {
      accession: z.string().min(3).describe('UniProt accession, e.g. "P04637"')
    },
    async (a) => {
      try {
        return text(await proteinRecord(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "proteins_by_taxon",
    "Proteins recorded for a species by NCBI taxon ID.",
    {
      taxid: z.number().int().positive().describe("NCBI taxon ID, e.g. 9606"),
      limit: z.number().int().min(1).max(50).default(10).describe("Proteins to return")
    },
    async (a) => {
      try {
        return text(await proteinsByTaxon(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "protein_features",
    "Annotated sequence features such as domains and active sites.",
    {
      accession: z.string().min(3).describe("UniProt accession"),
      category: z.string().optional().describe('Optional feature type filter, e.g. "DOMAIN" or "ACT_SITE"')
    },
    async (a) => {
      try {
        return text(await proteinFeatures(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
