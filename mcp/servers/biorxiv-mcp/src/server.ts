import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { paper, papers } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "biorxiv-mcp", version: "1.0.0" })

  server.tool(
    "papers",
    "bioRxiv preprints posted in a date range, with authors, category, DOI and version.",
    {
      start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("First day, YYYY-MM-DD; default 6 days before end"),
      end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Last day, YYYY-MM-DD; default today"),
      cursor: z.number().int().min(0).default(0).describe("Offset, for the next page"),
    },
    async ({ start, end, cursor }) => {
      try {
        return text(await papers(start, end, cursor))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "paper",
    "One bioRxiv preprint by DOI: title, authors, institution, category, dates, version and abstract.",
    { doi: z.string().min(6).describe('bioRxiv DOI, e.g. "10.1101/2023.12.30.573731"') },
    async ({ doi }) => {
      try {
        return text(await paper(doi))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
