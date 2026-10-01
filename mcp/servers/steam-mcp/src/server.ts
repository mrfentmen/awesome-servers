import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { SteamError, fmtPrice, formatAppDetail, formatStoreItem, getAppDetail, getNews, getPlayerCount, getReviewSummary, getTopSellers, searchStore, storeHighlights, salesCheck, playerCountRank, game_achievements } from "./api.js"
import { premiumTool } from "./gateway.js"
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
  server.registerTool(
    "store_highlights",
    {
      title: "Store highlights",
      description:
        "What Steam is pushing today: everything on sale with its discount, this week's new releases and the coming-soon list, in one call.",
      inputSchema: z.object({
        limit: z.number().describe("Items per section, 1-20. Defaults to 6.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await storeHighlights({ limit }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "sales_check",
    {
      title: "Check a wishlist for sales",
      description:
        "Check up to 15 app ids for a current discount and report the biggest one - how a wishlist is reviewed before a sale ends.",
      inputSchema: z.object({
        appids: z.array(z.number()).describe('Steam app ids, e.g. [620, 440, 730]'),
      }),
      annotations: READ_ONLY,
    },
    async ({ appids }) => {
      try {
        return text(await salesCheck({ appids }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "player_count_rank",
    {
      title: "Rank by live players",
      description:
        "Live concurrent player counts for up to 15 games, ranked, so a shortlist can be compared on what is actually being played now.",
      inputSchema: z.object({
        appids: z.array(z.number()).describe('Steam app ids, e.g. [730, 570, 440]'),
      }),
      annotations: READ_ONLY,
    },
    async ({ appids }) => {
      try {
        return text(await playerCountRank({ appids }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "game_requirements",
    {
      title: "Game requirements",
      description: "What a Steam title needs to run: minimum and recommended requirements for Windows, macOS and Linux with the store markup stripped to text, plus platform support flags, recommended age and interface languages.",
      inputSchema: z.object({
        appid: z.number().describe("Steam appid, e.g. 1245620 for Elden Ring."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: game_requirements ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_steam_game_requirements", args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "game_dlc_cost",
    {
      title: "Cost of all DLC",
      description: "Total what owning a Steam title completely costs: the base game plus each downloadable item priced on its own, compared against the editions Steam sells, since buying them separately is often cheaper.",
      inputSchema: z.object({
        appid: z.number().describe("Steam appid, e.g. 1245620 for Elden Ring."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: game_dlc_cost ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_steam_game_dlc_cost", args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "game_achievements",
    {
      title: "Game achievements",
      description: "How many Steam achievements a title has, how many are named up front versus hidden secrets, and whether the store record lists any at all.",
      inputSchema: z.object({
        appid: z.number().describe("Steam appid, e.g. 1245620 for Elden Ring."),
      }),
      annotations: READ_ONLY,
    },
    async ({ appid }) => {
      try {
        return text(await game_achievements({ appid }))
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
