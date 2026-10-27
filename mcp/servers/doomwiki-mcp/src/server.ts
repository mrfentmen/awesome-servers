import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { categoryMembers, cleanWikiText, DoomWikiError, getPage, searchPages } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

export function createServer(): McpServer {
  const server = new McpServer({
    name: "doomwiki-mcp",
    version: "1.0.0",
  })

  server.tool(
    "search_pages",
    "Search the Doom Wiki for pages about demons, weapons, levels, and lore.",
    { query: z.string().describe("Search term, e.g. 'cyberdemon' or 'BFG 9000'"), limit: z.number().int().min(1).max(20).default(8) },
    async ({ query, limit }) => {
      try {
        const hits = await searchPages(query, limit)
        if (hits.length === 0) return text(`No Doom Wiki pages match "${query}".`)
        return text(`Doom Wiki pages matching "${query}":\n${hits.map((h, i) => `${i + 1}. ${h.title}${h.pageid ? ` (id ${h.pageid})` : ""}`).join("\n")}`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_page",
    "Get a Doom Wiki page as cleaned text.",
    { title: z.string().describe("Exact page title, e.g. 'Cyberdemon'"), maxChars: z.number().int().min(500).max(12000).default(4000) },
    async ({ title, maxChars }) => {
      try {
        const wt = await getPage(title)
        return text(`# ${title}\n\n${cleanWikiText(wt, maxChars)}`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_category",
    "List pages in a Doom Wiki category.",
    { category: z.string().describe("Category name without the prefix, e.g. 'Weapons'"), limit: z.number().int().min(1).max(50).default(20) },
    async ({ category, limit }) => {
      try {
        const hits = await categoryMembers(category, limit)
        if (hits.length === 0) return text(`No pages in category "${category}".`)
        return text(`Doom Wiki category ${category}:\n${hits.map((h, i) => `${i + 1}. ${h.title}`).join("\n")}`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof DoomWikiError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
