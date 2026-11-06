import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { doi, search } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "datacite-mcp", version: "1.0.0" })

  server.tool(
    "search",
    "Search DataCite DOIs: datasets, software, preprints and other research outputs, with creators and publisher.",
    {
      query: z.string().min(1).describe('Words to search for, e.g. "electrolyser" or "software citation"'),
      limit: z.number().int().min(1).max(100).default(10).describe("Results to return, 1-100"),
    },
    async ({ query, limit }) => {
      try {
        return text(await search(query, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "doi",
    "One DataCite record by DOI: title, creators, publisher, year, type, URL, citations and abstract.",
    { doi: z.string().min(6).describe('DOI, e.g. "10.5281/zenodo.24002992" or a doi.org URL') },
    async ({ doi: value }) => {
      try {
        return text(await doi(value))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
