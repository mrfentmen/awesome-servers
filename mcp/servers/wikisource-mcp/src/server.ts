import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { extract, format, searchTitles, pageBacklinks } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)
const error = (e: unknown) => errorText(e).content[0].text

export function createServer() {
  const server = new McpServer({ name: "wikisource-mcp", version: "1.0.0" })
  server.registerTool(
    "search_texts",
    {
      title: "Search texts",
      description: "Search Wikisource titles and snippets for texts and primary sources hosted on the project.",
      inputSchema: z.object( { query: z.string().min(1).max(200), limit: z.number().int().min(1).max(25).default(10) }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
    try { return text(format(await searchTitles(query, limit))) } catch (error) { return errorText(error) }
  }
  )
  server.registerTool(
    "read_text",
    {
      title: "Read text",
      description: "Read a bounded plain-text extract from a Wikisource page. Verify the page's rights and edition before reuse.",
      inputSchema: z.object( { title: z.string().min(1).max(300), introOnly: z.boolean().default(true), maxCharacters: z.number().int().min(200).max(12000).default(4000) }),
      annotations: READ_ONLY,
    },
    async ({ title, introOnly, maxCharacters }) => {
    try { return text(format(await extract(title, introOnly, maxCharacters))) } catch (error) { return errorText(error) }
  }
  )
  server.registerTool(
    "page_summary",
    {
      title: "Page summary",
      description: "A readable lead summary of a Wikisource page: description, Wikidata item, last edit time, lead extract and link. Verify rights and edition before reuse.",
      inputSchema: z.object( { title: z.string().min(1).max(300), maxCharacters: z.number().int().min(200).max(6000).default(1200) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement summary locally (paywall removed)
    try { return textError("Not yet implemented: summary") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "page_categories",
    {
      title: "Page categories",
      description: "The categories a Wikisource text is filed under: year, author, genre, licence and transcription status.",
      inputSchema: z.object( { title: z.string().min(1).max(300), limit: z.number().int().min(1).max(100).default(20) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement categories locally (paywall removed)
    try { return textError("Not yet implemented: categories") } catch (e) { return textError(String(e)) }
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
    // TODO: implement history locally (paywall removed)
    try { return textError("Not yet implemented: history") } catch (e) { return textError(String(e)) }
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

  return server
}
