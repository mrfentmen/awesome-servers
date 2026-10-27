import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { WikiError, getPageWikitext, getSubpages, searchPages } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

export function createServer(): McpServer {
  const server = new McpServer({
    name: "walkthrough-mcp",
    version: "1.0.0",
  })

  server.tool(
    "search_games",
    "Search StrategyWiki for games and guides by title. Returns page " +
      "titles to pass to the other tools.",
    { query: z.string().describe("Game title, e.g. 'Ocarina of Time' or 'Final Fantasy VII'") },
    async ({ query }) => {
      try {
        const results = await searchPages(query)
        if (results.length === 0) return text(`No results found for "${query}".`)
        return text(
          `StrategyWiki matches for "${query}":\n` +
            results
              .map(
                (r, i) =>
                  `${i + 1}. ${r.title}\n   ${r.url}${r.snippet ? `\n   ${r.snippet.slice(0, 120)}` : ""}`
              )
              .join("\n")
        )
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_game_pages",
    "List the subpages of a game page — typically a Walkthrough, plus " +
      "cheats/guides sections. Pass any returned page title to get_guide.",
    {
      title: z.string().describe(
        "Game page title from search_games, e.g. 'The Legend of Zelda: Ocarina of Time'"
      ),
    },
    async ({ title }) => {
      try {
        const subpages = await getSubpages(title)
        if (subpages.length === 0) {
          return text(
            `No subpages found for "${title}". Try search_games to find the exact page title.`
          )
        }
        return text(
          `Pages under "${title}":\n` +
            subpages
              .map((p, i) => `${i + 1}. ${p.title}\n   ${p.url}`)
              .join("\n")
        )
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_guide",
    "Fetch the full text of a walkthrough, FAQ, or cheat guide page.",
    {
      title: z.string().describe(
        "Page title from search_games / get_game_pages, e.g. 'The Legend of Zelda: Ocarina of Time/Walkthrough'"
      ),
      maxChars: z
        .number()
        .int()
        .min(500)
        .max(40000)
        .default(12000)
        .describe("Max characters of guide text to return"),
    },
    async ({ title, maxChars }) => {
      try {
        const content = await getPageWikitext(title)
        const truncated =
          content.length > maxChars
            ? content.slice(0, maxChars) +
              `\n…[truncated — full page is ${content.length} chars]`
            : content
        return text(truncated)
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
