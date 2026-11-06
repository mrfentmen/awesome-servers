import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { OpenCitationsError, citations, counts, references } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

const doiArg = z.string().min(6).describe('DOI, e.g. "10.1038/nature12373" or a doi.org URL')

export function createServer(): McpServer {
  const server = new McpServer({ name: "opencitations-mcp", version: "1.0.0" })

  server.tool(
    "citations",
    "Works that cite a DOI, from the OpenCitations Index.",
    { doi: doiArg, limit: z.number().int().min(1).max(100).default(25).describe("How many links to print, 1-100") },
    async ({ doi, limit }) => {
      try {
        return text(await citations(doi, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "references",
    "Works that a DOI cites, from the OpenCitations Index.",
    { doi: doiArg, limit: z.number().int().min(1).max(100).default(25).describe("How many links to print, 1-100") },
    async ({ doi, limit }) => {
      try {
        return text(await references(doi, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "counts",
    "How many works cite a DOI, and how many works it cites.",
    { doi: doiArg },
    async ({ doi }) => {
      try {
        return text(await counts(doi))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
