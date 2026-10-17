import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { paperInfo, searchPapers, paper_references } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "semantic-scholar-mcp", version: "1.0.0" })
  server.registerTool(
    "search_papers",
    {
      title: "Search papers",
      description: "Search academic papers.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await searchPapers(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "paper_info",
    {
      title: "Paper info",
      description: "Get details and citation count for a paper.",
      inputSchema: z.object( { paperId: z.string().describe("Semantic Scholar paper ID.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await paperInfo(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "paper_citations",
    {
      title: "Paper citations",
      description: "List the papers that cite a given paper, most recent first, with their year, authors, venue, own citation count and DOI, plus the span of years citing work appears in and the busiest single year. The existing tools report a citation count as a bare number and can never say who the citations came from.",
      inputSchema: z.object({
        paperId: z.string().describe("Paper id, for instance 'DOI:10.1038/nature12373'. Search with search_papers first."),
        limit: z.number().int().min(1).max(50).optional().describe("How many citing papers to list. Default 10."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // TODO: implement citations locally (paywall removed)
      try { return textError("Not yet implemented: citations") } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "paper_references",
    {
      title: "Paper references",
      description: "List the works a given paper cites, oldest first, with year, authors and venue, and say how many references the index could not resolve. This is the backward view: what a paper was built on. paperInfo reports a referenceCount as a number and cannot show any of the works behind it.",
      inputSchema: z.object({
        paperId: z.string().describe("Paper id, for instance 'DOI:10.1038/nature12373'."),
        limit: z.number().int().min(1).max(50).optional().describe("How many references to list. Default 10."),
      }),
      annotations: READ_ONLY,
    },
    async ({ paperId, limit }) => {
      try { return text(await paper_references({ paperId, limit })) } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "paper_field",
    {
      title: "Paper field placement",
      description: "Report how the Semantic Scholar index itself reads a paper: its fields of study and the index's own weighted categories, publication types, total against influential citations with the share and what that ratio means, reference list length, open access status and PDF link, and the index's generated summary with a warning that it is not the authors' own words. paperInfo prints the abstract and two counts and none of this.",
      inputSchema: z.object({
        paperId: z.string().describe("Paper id, for instance 'DOI:10.1038/nature12373'."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // TODO: implement field locally (paywall removed)
      try { return textError("Not yet implemented: field") } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "paper_authors",
    {
      title: "Paper authors",
      description: "List every author Semantic Scholar has for a paper, most cited first, with each author's id, h-index, career citation and paper counts, affiliations and homepage. paperInfo prints at most five bare names with no ids, so it cannot show the full list or reach any of the author profiles this returns ids for.",
      inputSchema: z.object({ paperId: z.string().describe("Paper id, for instance 'DOI:10.1038/nature12373'.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement authors locally (paywall removed)
    try { return textError("Not yet implemented: authors") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
