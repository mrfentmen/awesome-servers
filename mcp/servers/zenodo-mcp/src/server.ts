import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { record, search } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "zenodo-mcp", version: "1.0.0" })

  server.tool(
    "search",
    "Search Zenodo research records: datasets, software, papers and presentations, newest first.",
    {
      q: z.string().min(1).describe('Search terms, e.g. "electrolyser" or a Zenodo query'),
      limit: z.number().int().min(1).max(100).default(10).describe("Results to return, 1-100"),
    },
    async ({ q, limit }) => {
      try {
        return text(await search(q, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "record",
    "One Zenodo record by id or DOI: title, creators, date, type, files, downloads and description.",
    { id: z.string().min(1).describe('Record id like "1234567", a DOI, or a zenodo.org record URL') },
    async ({ id }) => {
      try {
        return text(await record(id))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
