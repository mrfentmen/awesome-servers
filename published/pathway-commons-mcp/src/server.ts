import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { findPathways, searchProteins, searchTerms, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "pathway-commons-mcp", version: "1.0.0" })

  server.tool(
    "search_terms",
    "Search every entity type (pathway, protein, complex and more) by name or keyword.",
    {
      query: z.string().min(2).describe("Search text, e.g. TP53 or apoptosis"),
      limit: z.number().int().min(1).max(50).default(10).describe("Hits to return")
    },
    async (a) => {
      try {
        return text(await searchTerms(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  server.tool(
    "find_pathways",
    "Search only pathways by name and list where each one comes from (Reactome, KEGG and others).",
    {
      query: z.string().min(2).describe("Pathway name or keyword, e.g. apoptosis"),
      limit: z.number().int().min(1).max(50).default(10).describe("Hits to return")
    },
    async (a) => {
      try {
        return text(await findPathways(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  server.tool(
    "search_proteins",
    "Search only proteins and protein families by name.",
    {
      query: z.string().min(2).describe("Protein name or gene symbol, e.g. BRCA1"),
      limit: z.number().int().min(1).max(50).default(10).describe("Hits to return")
    },
    async (a) => {
      try {
        return text(await searchProteins(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  return server
}
