import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { BulbapediaError, formatArticle, getArticle, randomArticle, searchArticles, pageLinks } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "bulbapedia-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_articles",
    {
      title: "Search Bulbapedia",
      description: "Search Bulbapedia: Pokemon species, moves, abilities, characters, episodes, TCG sets.",
      inputSchema: z.object({
        query: z.string().describe("Search text, e.g. 'Pikachu', 'Thunderbolt move', 'Scarlet Violet'"),
        limit: z.number().int().min(1).max(20).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        const results = await searchArticles(query, limit)
        if (results.length === 0) return text(`No Bulbapedia articles match "${query}".`)
        return text(
          `Bulbapedia results for "${query}":\n\n${results.map((h, i) => `${i + 1}. ${h.title}${h.snippet ? ` — ${h.snippet.slice(0, 140)}` : ""}`).join("\n")}`
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
      description: "Get a Bulbapedia article summary: intro text plus wiki link.",
      inputSchema: z.object({
        title: z.string().describe("Exact article title, e.g. 'Pikachu (Pokémon)' (use search_articles to find it)"),
      }),
      annotations: READ_ONLY,
    },
    async ({ title }) => {
      try {
        const a = await getArticle(title)
        if (!a) return text(`No Bulbapedia article titled "${title}".`)
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
      description: "Open a random Bulbapedia article. Great for discovering obscure Pokemon and lore.",
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
    "page_details",
    {
      title: "Page details",
      description: "Full page metadata for a Bulbapedia article beyond its intro text: page id, canonical URL, byte length, last touch and revision with editor, linked Wikidata item and every category the page sits in.",
      inputSchema: z.object( { title: z.string().describe("Page title, e.g. Pikachu.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: page_details ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_bulbapedia_page_details", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "category_members",
    {
      title: "Category members",
      description: "List the pages inside any Bulbapedia category, automatically adding the Category prefix, reporting how many members the API returned and whether more pages of results exist.",
      inputSchema: z.object( { category: z.string().describe("Category name, e.g. Pokémon or Type:Electric."), limit: z.number().describe("Max members.").optional(), namespace: z.number().describe("Restrict to one namespace id.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: category_members ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_bulbapedia_category_members", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "page_links",
    {
      title: "Page links",
      description: "Outbound wiki links and images used by a Bulbapedia page, with any redirect the title resolved through, useful for tracing how an article connects to the rest of the site.",
      inputSchema: z.object( { title: z.string().describe("Page title, e.g. Pikachu."), limit: z.number().describe("Max links and images.").optional(), redirects: z.boolean().describe("Follow redirects.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await pageLinks(args)) } catch (e) { return textError(e instanceof Error ? `Error: ${e.message}` : String(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof BulbapediaError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
