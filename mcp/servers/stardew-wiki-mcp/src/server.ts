import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatArticle, getPage, randomPage, searchWiki, StardewError, categoryMembers, pageLinks, pageSections } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "stardew-wiki-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_wiki",
    {
      title: "Search Stardew Wiki",
      description: "Search the Stardew Valley Wiki: crops, villagers, fish, quests, items, festivals, bundles.",
      inputSchema: z.object({
        query: z.string().describe("Search text, e.g. 'parsnip', 'Sebastian gifts', 'greenhouse'"),
        limit: z.number().int().min(1).max(20).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        const results = await searchWiki(query, limit)
        if (results.length === 0) return text(`No Stardew Wiki pages match "${query}".`)
        return text(
          `Stardew Wiki results for "${query}":\n\n${results.map((h, i) => `${i + 1}. ${h.title}${h.snippet ? ` — ${h.snippet.slice(0, 140)}` : ""}`).join("\n")}`
        )
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_page",
    {
      title: "Get wiki page",
      description: "Get a Stardew Valley Wiki page: guide text, wiki link, thumbnail.",
      inputSchema: z.object({
        title: z.string().describe("Exact page title, e.g. 'Parsnip' (use search_wiki to find it)"),
      }),
      annotations: READ_ONLY,
    },
    async ({ title }) => {
      try {
        const a = await getPage(title)
        if (!a) return text(`No Stardew Wiki page titled "${title}".`)
        return text(formatArticle(a))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "random_page",
    {
      title: "Random wiki page",
      description: "Open a random Stardew Valley Wiki page. Great for discovering crops, villagers, and secrets.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const { title } = await randomPage()
        const a = await getPage(title)
        if (!a) return text(`Random pick: ${title}`)
        return text(formatArticle(a))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "category_members",
    {
      title: "Category members",
      description: "List the pages in a Stardew Wiki category, so you can enumerate things like crops, villagers, fish or items.",
      inputSchema: z.object({
        category: z.string().describe("Category name, e.g. 'Crops', 'Spring crops' or 'Villagers'."),
        limit: z.number().int().min(1).max(200).default(40),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: category_members ----
      const paywallMessage = await premiumRequired("category_members")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try {
        return text(await categoryMembers(args))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "page_links",
    {
      title: "Page links",
      description: "List the wiki pages a Stardew Wiki article links to, which is how you walk from one topic to the related ones.",
      inputSchema: z.object({
        title: z.string().describe("Page title, e.g. 'Parsnip' or 'Spring crops'."),
        limit: z.number().int().min(1).max(200).default(40),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: page_links ----
      const paywallMessage = await premiumRequired("page_links")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try {
        return text(await pageLinks(args))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "page_sections",
    {
      title: "Page sections",
      description: "List the section headings of a Stardew Wiki article, giving you its table of contents before you fetch the full text.",
      inputSchema: z.object({
        title: z.string().describe("Page title, e.g. 'Greenhouse'."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: page_sections ----
      const paywallMessage = await premiumRequired("page_sections")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try {
        return text(await pageSections(args))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof StardewError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
