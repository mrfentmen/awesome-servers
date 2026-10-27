import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  SegaError,
  categoryMembers,
  getPage,
  searchPages,
  wikiTextToPlain,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

export function createServer(): McpServer {
  const server = new McpServer({
    name: "segaretro-mcp",
    version: "1.0.0",
  })

  server.tool(
    "search_pages",
    "Search Sega Retro — every Sega game, console, and unreleased hardware.",
    { query: z.string().describe("Search terms, e.g. 'Sonic the Hedgehog' or 'Dreamcast'") },
    async ({ query }) => {
      try {
        const pages = await searchPages(query)
        if (pages.length === 0) return text(`No Sega Retro pages match "${query}".`)
        return text(
          `Sega Retro results for "${query}":\n\n` +
            pages
              .map(
                (p, i) =>
                  `${i + 1}. ${p.title}\n   ${p.snippet ?? ""}\n   https://segaretro.org/${encodeURIComponent(p.title).replace(/%2F/g, "/")}`
              )
              .join("\n\n")
        )
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_page",
    "Get a page's content as readable text.",
    {
      title: z.string().describe("Exact page title from search_pages"),
      maxChars: z.number().int().min(500).max(30000).default(12000),
    },
    async ({ title, maxChars }) => {
      try {
        const page = await getPage(title)
        if (!page) return text(`No Sega Retro page "${title}".`)
        const plain = wikiTextToPlain(page.wikitext, maxChars)
        return text(`${page.title}\n${page.url}\n\n${plain || "(no readable content)"}`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_category",
    "List pages in a Sega Retro category (e.g. 'Category:Games', 'Category:Consoles').",
    { category: z.string().describe("Category name, e.g. 'Category:Games'") },
    async ({ category }) => {
      try {
        const members = await categoryMembers(category)
        if (members.length === 0) return text(`Empty or missing category "${category}".`)
        return text(`Pages in ${category}:\n` + members.map((m, i) => `${i + 1}. ${m}`).join("\n"))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof SegaError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
