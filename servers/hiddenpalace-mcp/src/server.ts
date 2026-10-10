import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { WikiError, getPage, searchPages, wikiTextToPlain, recentChanges, pageInfo, listCategories } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "hiddenpalace-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_pages",
    {
      title: "Search pages",
      description: "Search hiddenpalace.org — unreleased prototypes, beta builds, and " +
      "cut content documentation.",
      inputSchema: z.object(
    { query: z.string().describe("Search terms, e.g. 'Super Mario 64 beta' or 'Sonic prototype'") }),
      annotations: READ_ONLY,
    },
    async ({ query }) => {
      try {
        const pages = await searchPages(query)
        if (pages.length === 0) return text(`No hiddenpalace pages match "${query}".`)
        return text(
          `hiddenpalace.org results for "${query}":\n\n` +
            pages
              .map(
                (p, i) =>
                  `${i + 1}. ${p.title}\n   ${p.snippet ?? ""}\n   https://hiddenpalace.org/w/${encodeURIComponent(p.title).replace(/%2F/g, "/")}`
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
        if (!page) return text(`No hiddenpalace page "${title}".`)
        const plain = wikiTextToPlain(page.wikitext, maxChars)
        return text(`${page.title}\n${page.url}\n\n${plain || "(no readable content)"}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "recent_changes",
    {
      title: "Recent changes",
      description: "The newest edits and new pages on hiddenpalace.org, with editor, timestamp and page size.",
      inputSchema: z.object(
    { limit: z.number().int().min(1).max(50).default(15) }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: recent_changes ----
      const paywallMessage = await premiumRequired("recent_changes")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try {
        return text(await recentChanges(args))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "page_info",
    {
      title: "Page info",
      description: "Dated metadata for one hiddenpalace.org page: canonical URL, page id, byte length and who last edited it.",
      inputSchema: z.object(
    { title: z.string().describe("Exact page title") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: page_info ----
      const paywallMessage = await premiumRequired("page_info")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try {
        return text(await pageInfo(args))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_categories",
    {
      title: "List categories",
      description: "The categories hiddenpalace.org files its prototype documentation under.",
      inputSchema: z.object(
    { limit: z.number().int().min(1).max(200).default(40) }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try {
        return text(await listCategories(args))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof WikiError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
