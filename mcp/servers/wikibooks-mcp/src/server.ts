import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { search, book, browseCategories } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "wikibooks-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search Wikibooks titles.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "book",
    {
      title: "Book",
      description: "Full plain text of a Wikibooks page, from a title found with search.",
      inputSchema: z.object( { title: z.string().describe("Exact Wikibooks page title.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: book ----
    const paywallMessage = await premiumRequired("book")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await book(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "browse_categories",
    {
      title: "Browse categories",
      description: "List Wikibooks categories whose name starts with a prefix, to find a shelf or subject.",
      inputSchema: z.object( { prefix: z.string().describe("Category name prefix, e.g. \"Cook\"."), limit: z.number().int().min(1).max(50).default(20).describe("Max categories.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: browse_categories ----
    const paywallMessage = await premiumRequired("browse_categories")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await browseCategories(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
