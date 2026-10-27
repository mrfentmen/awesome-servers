import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { proteinDomains, searchEntries, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "interpro-mcp", version: "1.0.1" })

  server.tool(
    "search_entries",
    "Search InterPro entries (families, domains, sites) by free text.",
    {
      query: z.string().min(2).describe('Search text, e.g. "kinase"'),
      limit: z.number().int().min(1).max(25).default(10).describe("Entries to return")
    },
    async (a) => {
      try {
        return text(await searchEntries(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "protein_domains",
    "Every InterPro entry that matches one protein accession.",
    {
      accession: z.string().regex(/^[A-Z0-9]{6,10}$/i).describe('UniProt accession, e.g. "P04637"'),
      limit: z.number().int().min(1).max(40).default(15).describe("Matches to return")
    },
    async (a) => {
      try {
        return text(await proteinDomains(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}
