import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { literatureRecord, searchAuthors, searchLiterature, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "inspire-hep-mcp", version: "1.0.0" })

  server.tool(
    "search_literature",
    "Search high-energy physics papers by title, author or topic.",
    {
      query: z.string().min(2).describe('Search terms, e.g. "higgs boson" or "a Einstein"'),
      limit: z.number().int().min(1).max(25).default(8).describe("Papers to return"),
      sort: z.enum(["mostrecent", "mostcited"]).default("mostrecent").describe("Ordering")
    },
    async (a) => {
      try {
        return text(await searchLiterature(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "literature_record",
    "Read one paper record by INSPIRE ID or arXiv ID.",
    {
      id: z.string().min(1).describe("INSPIRE record id or arXiv id")
    },
    async (a) => {
      try {
        return text(await literatureRecord(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_authors",
    "Find INSPIRE author profiles.",
    {
      query: z.string().min(2).describe('Author name, e.g. "Einstein"'),
      limit: z.number().int().min(1).max(25).default(8).describe("Authors to return")
    },
    async (a) => {
      try {
        return text(await searchAuthors(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}
