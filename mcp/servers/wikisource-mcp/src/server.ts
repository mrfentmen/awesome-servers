import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { extract, format, searchTitles, pageSummary, pageCategories } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)

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
    // ---- paywall: page_summary ----
    const paywallMessage = await premiumRequired("page_summary")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await pageSummary(args)) } catch (error) { return errorText(error) }
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
    // ---- paywall: page_categories ----
    const paywallMessage = await premiumRequired("page_categories")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await pageCategories(args)) } catch (error) { return errorText(error) }
  }
  )

  return server
}
