import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { search, sectionCensus } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "mdn-search-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search MDN web docs.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "search_ranked",
    {
      title: "Search ranked",
      description: "The top MDN hits with the figures the plain search drops: MDN own relevance score, popularity weight, the section path of each page and the matched body text with the highlight markup removed.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Hits to show, 1-10.").optional(), section: z.string().describe("Keep only hits whose slug starts with this section, e.g. glossary or learn_web_development.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement ranked locally (paywall removed)
    try { return textError("Not yet implemented: ranked") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "section_census",
    {
      title: "Section census",
      description: "Where a term actually lives on MDN: which top-level sections returned hits, the best scoring page in each, which common sections came back empty, and whether two hits share a title, which usually means a reference page and a glossary entry both exist.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), locales: z.string().describe("Up to 4 MDN locales, default en-US.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await sectionCensus(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "locale_coverage",
    {
      title: "Locale coverage",
      description: "How many MDN locales have a page for a term and what that page is called in each: the top hit and its index total per locale, the distinct titles, and the best scoring hit per locale.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), locales: z.string().describe("Up to 6 MDN locales. Defaults to the first six major locales.").optional(), limit: z.number().describe("Best hits to rank, 1-10.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement coverage locally (paywall removed)
    try { return textError("Not yet implemented: coverage") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
