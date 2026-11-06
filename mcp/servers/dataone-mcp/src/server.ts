import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { DataoneError, facets, record, search } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof DataoneError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "dataone-mcp", version: "1.0.0" })

  server.tool(
    "search",
    "Search DataONE: earth, environmental and ecological science data from NCEI, PANGAEA, LTER, DRYAD and other repositories.",
    {
      q: z
        .string()
        .min(1)
        .default("*:*")
        .describe('Words to look for, e.g. "ocean temperature". Solr field syntax works too: title:climate'),
      limit: z.number().int().min(1).max(100).default(10).describe("Records per page, 1-100"),
      page: z.number().int().min(1).default(1).describe("Page number, starting at 1"),
    },
    async ({ q, limit, page }) => {
      try {
        return text(await search({ q, limit, page }))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "record",
    "One DataONE record by identifier: author, format, data source, size, licence, keywords, abstract and the data link.",
    {
      id: z
        .string()
        .min(3)
        .describe('DataONE identifier, e.g. "sha256:ec318a95..." or a cn.dataone.org/cn/v2/resolve/... URL'),
    },
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
    "Counts for a DataONE search broken down by format type, data source and keyword. Use it to narrow a topic before searching.",
    {
      q: z.string().min(1).describe('Words to look for, e.g. "ocean temperature"'),
      top: z.number().int().min(1).max(50).default(8).describe("How many values to show per facet"),
    },
    async ({ q, top }) => {
      try {
        return text(await facets(q, top))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
