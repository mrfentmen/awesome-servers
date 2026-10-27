import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { searchVariants, variantDetail, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "clinvar-mcp", version: "1.0.0" })

  server.tool(
    "search_variants",
    "Search ClinVar variants by gene, condition or HGVS text.",
    {
      term: z.string().min(2).describe('Search term, e.g. "BRCA1" or "Lynch syndrome"'),
      limit: z.number().int().min(1).max(25).default(10).describe("Variants to return")
    },
    async (a) => {
      try {
        return text(await searchVariants(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "variant_detail",
    "One ClinVar record: classification, review status, traits and location.",
    {
      uid: z.string().regex(/^\d+$/).describe("ClinVar uid from search_variants")
    },
    async (a) => {
      try {
        return text(await variantDetail(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}
