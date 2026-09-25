import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  SteamError,
  fmtPrice,
  formatAppDetail,
  formatStoreItem,
  getAppDetail,
  getNews,
  getPlayerCount,
  getReviewSummary,
  getTopSellers,
  searchStore,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "steam-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_games",
    {
      title: "Search games",
      description: "Search the Steam store by title. Returns appids with current prices " +
      "and discounts.",
      inputSchema: z.object(
    { query: z.string().describe("Game title, e.g. 'Helldivers' or 'Baldur'") }),
      annotations: READ_ONLY,
    },
    async ({ query }) => {
      try {
        const items = await searchStore(query)
        if (items.length === 0) return text(`Nothing on Steam matches "${query}".`)
        return text(
          `Steam results for "${query}":\n` +
            items.map((i, n) => `${n + 1}. ${formatStoreItem(i)}`).join("\n")
        )
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_game_details",
    {
      title: "Get game details",
      description: "Get details for a Steam app: price/discount, release date, " +
      "developers, genres, Metacritic, description.",
      inputSchema: z.object(
    { appid: z.number().int().describe("Steam app id from search_games") }),
      annotations: READ_ONLY,
    },
    async ({ appid }) => {
      try {
        const detail = await getAppDetail(appid)
        if (!detail) return text(`No Steam app with id ${appid}.`)
        return text(formatAppDetail(detail))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_game_news",
    {
      title: "Get game news",
      description: "Fetch recent Steam news posts for a game.",
      inputSchema: z.object(
    {
      appid: z.number().int().describe("Steam app id"),
      count: z.number().int().min(1).max(20).default(5).describe("Number of posts"),
    }),
      annotations: READ_ONLY,
    },
    async ({ appid, count }) => {
      try {
        const news = await getNews(appid, count)
        if (news.length === 0) return text(`No news for app ${appid}.`)
        return text(
          `Latest news for app ${appid}:\n` +
            news
              .map(
                (n, i) =>
                  `${i + 1}. ${n.title}${n.date ? ` (${n.date})` : ""}` +
                  (n.author ? ` by ${n.author}` : "") +
                  `\n   ${n.url}` +
                  (n.contents ? `\n   ${n.contents}` : "")
              )
              .join("\n\n")
        )
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "reviews",
    {
      title: "Review summary",
      description: "Review totals for a game: total, positive and negative counts plus the summary label.",
      inputSchema: z.object(
    { appid: z.number().describe("Steam app id, e.g. 292030.") }),
      annotations: READ_ONLY,
    },
    async ({ appid }) => {
      try {
        const s = await getReviewSummary(appid)
        return text(
          `Reviews: ${s.total.toLocaleString()} total, ${s.positive.toLocaleString()} positive, ${s.negative.toLocaleString()} negative — ${s.score_desc}.`
        )
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )
  server.registerTool(
    "players",
    {
      title: "Player count",
      description: "How many players are in a game right now.",
      inputSchema: z.object(
    { appid: z.number().describe("Steam app id, e.g. 292030.") }),
      annotations: READ_ONLY,
    },
    async ({ appid }) => {
      try {
        const n = await getPlayerCount(appid)
        return text(`Current players: ${n.toLocaleString()}.`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )
  server.registerTool(
    "topsellers",
    {
      title: "Top sellers",
      description: "Current Steam top sellers with prices and discounts.",
      inputSchema: z.object(
    { count: z.number().describe("How many entries, 1-10. Defaults to 10.").optional() }),
      annotations: READ_ONLY,
    },
    async ({ count }) => {
      try {
        const items = await getTopSellers(Math.min(Math.max(count ?? 10, 1), 10))
        if (!items.length) return text('No top sellers returned.')
        return text(
          `Steam top sellers:\n` + items.map((g, n) =>
            `${n + 1}. [${g.id}] ${g.name} — ${g.final_price != null ? fmtPrice(g.final_price, g.currency) : 'price n/a'}${g.discount_percent ? ` (-${g.discount_percent}%)` : ''}`
          ).join('\n')
        )
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )
  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof SteamError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
