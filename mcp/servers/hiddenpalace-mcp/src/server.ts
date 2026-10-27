import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { WikiError, getPage, searchPages, wikiTextToPlain } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

export function createServer(): McpServer {
  const server = new McpServer({
    name: "hiddenpalace-mcp",
    version: "1.0.0",
  })

  server.tool(
    "search_pages",
    "Search hiddenpalace.org — unreleased prototypes, beta builds, and " +
      "cut content documentation.",
    { query: z.string().describe("Search terms, e.g. 'Super Mario 64 beta' or 'Sonic prototype'") },
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
        if (!page) return text(`No hiddenpalace page "${title}".`)
        const plain = wikiTextToPlain(page.wikitext, maxChars)
        return text(`${page.title}\n${page.url}\n\n${plain || "(no readable content)"}`)
      } catch (e) {
        return text(errorMessage(e))
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
