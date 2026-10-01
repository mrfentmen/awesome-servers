import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { DfError, getPage, searchPages, wikiTextToPlain, pageLinks } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "dwarffortress-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_pages",
    {
      title: "Search pages",
      description: "Search the Dwarf Fortress wiki.",
      inputSchema: z.object(
    { query: z.string().describe("Search terms, e.g. 'adamantine' or 'vampire'") }),
      annotations: READ_ONLY,
    },
    async ({ query }) => {
      try {
        const pages = await searchPages(query)
        if (pages.length === 0) return text(`No DF wiki pages match "${query}".`)
        return text(
          `DF wiki results for "${query}":\n\n` +
            pages
              .map(
                (p, i) =>
                  `${i + 1}. ${p.title}\n   ${p.snippet ?? ""}\n   https://dwarffortresswiki.org/index.php/${encodeURIComponent(p.title).replace(/%2F/g, "/")}`
              )
              .join("\n\n")
        )
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_page",
    {
      title: "Get page",
      description: "Read a DF wiki page as plain text.",
      inputSchema: z.object(
    {
      title: z.string().describe("Exact page title from search_pages"),
      maxChars: z.number().int().min(500).max(30000).default(12000),
    }),
      annotations: READ_ONLY,
    },
    async ({ title, maxChars }) => {
      try {
        const page = await getPage(title)
        if (!page) return text(`No DF wiki page "${title}".`)
        const plain = wikiTextToPlain(page.wikitext, maxChars)
        return text(`${page.title}\n${page.url}\n\n${plain || "(no readable content)"}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "page_details",
    {
      title: "Page details",
      description: "Metadata for a Dwarf Fortress wiki article beyond its text: page id, canonical URL, last revision and editor, and every category the page is filed under.",
      inputSchema: z.object( { title: z.string().describe("Page title, e.g. Elf.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: page_details ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_dwarffortress_page_details", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "category_members",
    {
      title: "Category members",
      description: "List the pages and subcategories inside any Dwarf Fortress wiki category, adding the Category prefix when needed and flagging nested subcategories.",
      inputSchema: z.object( { category: z.string().describe("Category name, e.g. Creatures."), limit: z.number().describe("Max members.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: category_members ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_dwarffortress_category_members", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "page_links",
    {
      title: "Page links",
      description: "The pages a Dwarf Fortress wiki article links out to, optionally filtered by name, for tracing how a topic connects to the rest of the wiki.",
      inputSchema: z.object( { title: z.string().describe("Page title, e.g. Dwarf."), limit: z.number().describe("Max links.").optional(), search: z.string().describe("Filter link titles.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await pageLinks(args)) } catch (e) { return textError(e instanceof Error ? `Error: ${e.message}` : String(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof DfError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
