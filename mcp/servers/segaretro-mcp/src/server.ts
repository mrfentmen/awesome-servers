import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { SegaError, categoryMembers, getPage, pageMetadata, recentChanges, searchPages, wikiTextToPlain } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "segaretro-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_pages",
    {
      title: "Search pages",
      description: "Search Sega Retro — every Sega game, console, and unreleased hardware.",
      inputSchema: z.object(
    { query: z.string().describe("Search terms, e.g. 'Sonic the Hedgehog' or 'Dreamcast'") }),
      annotations: READ_ONLY,
    },
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
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_page",
    {
      title: "Get page",
      description: "Get a page's content as readable text.",
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
        if (!page) return text(`No Sega Retro page "${title}".`)
        const plain = wikiTextToPlain(page.wikitext, maxChars)
        return text(`${page.title}\n${page.url}\n\n${plain || "(no readable content)"}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_category",
    {
      title: "List category",
      description: "List pages in a Sega Retro category (e.g. 'Category:Games', 'Category:Consoles').",
      inputSchema: z.object(
    { category: z.string().describe("Category name, e.g. 'Category:Games'") }),
      annotations: READ_ONLY,
    },
    async ({ category }) => {
      try {
        const members = await categoryMembers(category)
        if (members.length === 0) return text(`Empty or missing category "${category}".`)
        return text(`Pages in ${category}:\n` + members.map((m, i) => `${i + 1}. ${m}`).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "recent_changes",
    {
      title: "Recent changes",
      description: "The newest edits and new articles on Sega Retro, with the editor, timestamp and edit comment.",
      inputSchema: z.object(
    { limit: z.number().int().min(1).max(50).default(15) }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try {
        return text(await recentChanges(args))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "page_metadata",
    {
      title: "Page metadata",
      description: "Dated metadata for one Sega Retro page: canonical URL, page id, byte length, last editor and the categories the page is filed under.",
      inputSchema: z.object(
    {
      title: z.string().describe("Exact page title from search_pages"),
      categoryLimit: z.number().int().min(1).max(60).default(20),
    }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try {
        return text(await pageMetadata(args))
      } catch (e) {
        return textError(errorMessage(e))
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
