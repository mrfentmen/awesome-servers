import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { categoryMembers, cleanWikiText, DoomWikiError, getPage, searchPages, siteStats } from "./api.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "doomwiki-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_pages",
    {
      title: "Search pages",
      description: "Search the Doom Wiki for pages about demons, weapons, levels, and lore.",
      inputSchema: z.object(
    { query: z.string().describe("Search term, e.g. 'cyberdemon' or 'BFG 9000'"), limit: z.number().int().min(1).max(20).default(8) }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        const hits = await searchPages(query, limit)
        if (hits.length === 0) return text(`No Doom Wiki pages match "${query}".`)
        return text(`Doom Wiki pages matching "${query}":\n${hits.map((h, i) => `${i + 1}. ${h.title}${h.pageid ? ` (id ${h.pageid})` : ""}`).join("\n")}`)
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "get_page",
    {
      title: "Get page",
      description: "Get a Doom Wiki page as cleaned text.",
      inputSchema: z.object(
    { title: z.string().describe("Exact page title, e.g. 'Cyberdemon'"), maxChars: z.number().int().min(500).max(12000).default(4000) }),
      annotations: READ_ONLY,
    },
    async ({ title, maxChars }) => {
      try {
        const wt = await getPage(title)
        return text(`# ${title}\n\n${cleanWikiText(wt, maxChars)}`)
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "get_category",
    {
      title: "Get category",
      description: "List pages in a Doom Wiki category.",
      inputSchema: z.object(
    { category: z.string().describe("Category name without the prefix, e.g. 'Weapons'"), limit: z.number().int().min(1).max(50).default(20) }),
      annotations: READ_ONLY,
    },
    async ({ category, limit }) => {
      try {
        const hits = await categoryMembers(category, limit)
        if (hits.length === 0) return text(`No pages in category "${category}".`)
        return text(`Doom Wiki category ${category}:\n${hits.map((h, i) => `${i + 1}. ${h.title}`).join("\n")}`)
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "site_stats",
    {
      title: "Site stats",
      description: "The Doom Wiki's own live counters: content pages, all pages, edits, files, users and admins.",
      inputSchema: z.object( {  } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await siteStats(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "page_info",
    {
      title: "Page info",
      description: "One page's metadata rather than its text: size, last editor and change summary, its categories and its url.",
      inputSchema: z.object( { title: z.string().describe("Exact page title, e.g. 'Cyberdemon'") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement info locally (paywall removed)
    try { return textError("Not yet implemented: info") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "recent_changes",
    {
      title: "Recent changes",
      description: "The live Doom Wiki edit feed with each change's timestamp, editor and summary, optionally narrowed to one namespace or to new pages only.",
      inputSchema: z.object( { limit: z.number().describe("How many changes to show, 1-50. Defaults to 10.").optional(), namespace: z.number().describe("Restrict to one namespace number, e.g. 0 for articles.").optional(), onlyNew: z.boolean().describe("Show only newly created pages, not edits.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement changes locally (paywall removed)
    try { return textError("Not yet implemented: changes") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof DoomWikiError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
