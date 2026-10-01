import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { formatArticle, getArticle, LostMediaError, randomArticle, searchArticles } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "lostmedia-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_lost_media",
    {
      title: "Search lost media",
      description: "Search the Lost Media Wiki: lost TV episodes, films, music, games, pilots, commercials.",
      inputSchema: z.object({
        query: z.string().describe("Search text, e.g. 'Doctor Who', 'lost cartoon pilot', 'unreleased album'"),
        limit: z.number().int().min(1).max(20).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        const results = await searchArticles(query, limit)
        if (results.length === 0) return text(`No Lost Media Wiki articles match "${query}".`)
        return text(
          `Lost Media Wiki results for "${query}":\n\n${results.map((h, i) => `${i + 1}. ${h.title}${h.snippet ? ` — ${h.snippet.slice(0, 140)}` : ""}`).join("\n")}`
        )
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_article",
    {
      title: "Get article",
      description: "Get a Lost Media Wiki article: what it is, found/partially-found/lost status, recovery story.",
      inputSchema: z.object({
        title: z.string().describe("Exact article title (use search_lost_media to find it)"),
      }),
      annotations: READ_ONLY,
    },
    async ({ title }) => {
      try {
        const a = await getArticle(title)
        if (!a) return text(`No Lost Media Wiki article titled "${title}".`)
        return text(formatArticle(a))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "random_article",
    {
      title: "Random article",
      description: "Open a random Lost Media Wiki article. Great for falling down the lost-media rabbit hole.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const { title } = await randomArticle()
        const a = await getArticle(title)
        if (!a) return text(`Random pick: ${title}`)
        return text(formatArticle(a))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "recent_changes",
    {
      title: "Recent changes",
      description: "The newest edits to Lost Media Wiki articles, with editor, timestamp, byte size change and edit summary.",
      inputSchema: z.object({ limit: z.number().int().min(1).max(30).default(10) }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: recent_changes ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_lostmedia_recent_changes", args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "browse_categories",
    {
      title: "Browse categories",
      description: "List Lost Media Wiki categories whose name starts with a prefix, to explore how lost media is organised.",
      inputSchema: z.object({
        prefix: z.string().describe("Category name prefix, e.g. \"Lost\" or \"Lost films\""),
        limit: z.number().int().min(1).max(50).default(25),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: browse_categories ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_lostmedia_browse_categories", args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "category_articles",
    {
      title: "Category articles",
      description: "List members of a Lost Media Wiki category, with page IDs and namespaces, to find articles and subcategories.",
      inputSchema: z.object({ category: z.string().min(1).max(200).describe("Category name, e.g. Lost films."), limit: z.number().int().min(1).max(30).optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: category_articles ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_lostmedia_category_articles", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof LostMediaError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
