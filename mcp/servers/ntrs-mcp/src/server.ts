import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { NtrsError, facets, record, search } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof NtrsError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

const centerArg = z
  .string()
  .min(2)
  .optional()
  .describe('NASA center code, e.g. "JPL", "GSFC", "MSFC", "JSC", "ARC", "LaRC", "GRC", "KSC", "HQ"')

const stiTypeArg = z
  .string()
  .min(2)
  .optional()
  .describe('Document type, e.g. "CONFERENCE_PAPER", "PRESENTATION", "PREPRINT", "ABSTRACT", "REPRINT", "OTHER"')

export function createServer(): McpServer {
  const server = new McpServer({ name: "ntrs-mcp", version: "1.0.0" })

  server.tool(
    "search",
    "Search NASA's technical report server. Returns id, title, authors, type, center and file availability.",
    {
      q: z.string().min(1).describe('Words to look for, e.g. "artemis lunar landing"'),
      limit: z.number().int().min(1).max(100).default(10).describe("Records per page, 1-100"),
      page: z.number().int().min(1).default(1).describe("Page number, starting at 1"),
      center: centerArg,
      stiType: stiTypeArg,
    },
    async ({ q, limit, page, center, stiType }) => {
      try {
        return text(await search(q, limit, page, center, stiType))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "record",
    "One NTRS record by id: full metadata, abstract, download links and related records.",
    { id: z.string().min(6).describe('NTRS id, e.g. "20230002992" or a full ntrs.nasa.gov/citations/... URL') },
    async ({ id }) => {
      try {
        return text(await record(id))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "facets",
    "Counts for a search broken down by center, document type, subject, keyword, year and author. Use it to narrow a topic before searching.",
    {
      q: z.string().min(1).describe('Words to look for, e.g. "additive manufacturing"'),
      top: z.number().int().min(1).max(50).default(8).describe("How many values to show per facet"),
      center: centerArg,
      stiType: stiTypeArg,
    },
    async ({ q, top, center, stiType }) => {
      try {
        return text(await facets(q, top, center, stiType))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
