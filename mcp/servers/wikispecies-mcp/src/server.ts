import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { search, pageCategories, pageHistory, pageBacklinks } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "wikispecies-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search species pages.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "species_page",
    {
      title: "Species page",
      description: "Plain-text extract of a Wikispecies taxon page, mostly the taxonavigation classification block.",
      inputSchema: z.object( { title: z.string().describe("Species page title, e.g. 'Vulpes vulpes'."), chars: z.number().describe("Max characters of extract.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement page locally (paywall removed)
    try { return textError("Not yet implemented: page") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "page_categories",
    {
      title: "Page categories",
      description: "Categories a Wikispecies taxon page belongs to, e.g. conservation status or vernacular-name categories.",
      inputSchema: z.object( { title: z.string().describe("Species page title, e.g. 'Vulpes vulpes'."), limit: z.number().describe("Max categories.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await pageCategories(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "page_history",
    {
      title: "Page history",
      description: "Inspect recent revisions of a page, including revision IDs, editors, timestamps and edit summaries.",
      inputSchema: z.object( { title: z.string().describe("Exact page title."), limit: z.number().describe("Maximum results, 1-30.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await pageHistory(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "backlinks",
    {
      title: "Page backlinks",
      description: "Find pages that link to an exact wiki page.",
      inputSchema: z.object( { title: z.string().describe("Exact target page title."), limit: z.number().describe("Maximum results, 1-30.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await pageBacklinks(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "category_members",
    {
      title: "Category members",
      description: "List pages and subcategories in an exact category.",
      inputSchema: z.object( { category: z.string().describe("Category name, with or without Category: prefix."), limit: z.number().describe("Maximum results, 1-30.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement members locally (paywall removed)
    try { return textError("Not yet implemented: members") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
