import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { search, pageSections } from "./api.js"
import { premiumTool } from "./gateway.js"
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
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_wikibooks_book", args)) } catch (e) { return textError(error(e)) }
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
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_wikibooks_browse_categories", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "page_history",
    {
      title: "Page revision history",
      description: "Recent revisions with timestamps, editors and edit comments.",
      inputSchema: z.object( { title: z.string().describe("Exact page title, e.g. Python Programming."), limit: z.number().describe("Maximum revisions, 1-30.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: page_history ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_wikibooks_page_history", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "page_sections",
    {
      title: "Page sections",
      description: "Table of contents headings and anchors for a Wikibooks page.",
      inputSchema: z.object( { title: z.string().describe("Exact page title, e.g. Python Programming."), limit: z.number().describe("Maximum headings, 1-50.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await pageSections(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "category_members",
    {
      title: "Category members",
      description: "Pages and subcategories inside a named Wikibooks category.",
      inputSchema: z.object( { category: z.string().describe("Category name, e.g. Subject:Computer science."), limit: z.number().describe("Maximum members, 1-50.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: category_members ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_wikibooks_category_members", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
