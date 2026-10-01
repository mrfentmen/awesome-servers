import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { deals, freeGames, gameDetails, searchGames, storeList, topDeals, steamLookup, filterDeals, valuePicks } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "cheapshark-mcp", version: "1.0.0" })
  server.registerTool(
    "deals",
    {
      title: "Deals",
      description: "Search current game deals under a price cap, optionally filtered by game title or store ID.",
      inputSchema: z.object({
        title: z.string().describe("Game title to search, e.g. 'Witcher'.").optional(),
        maxPrice: z.number().describe("Only show deals at or below this price in USD (default 60).").optional(),
        storeID: z.string().describe("Only this store, e.g. '1' for Steam. See store_list.").optional(),
        limit: z.number().describe("Max results (default 8, max 30).").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await deals(args)) } catch (e) { return textError(error(e)) }
    }
  )
  server.registerTool(
    "store_list",
    {
      title: "Store list",
      description: "List the game stores CheapShark tracks, with the store IDs used by the other tools.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try { return text(await storeList({})) } catch (e) { return textError(error(e)) }
    }
  )
  server.registerTool(
    "search_games",
    {
      title: "Search games",
      description: "Find a game by title and get its cheapest current price plus the gameID for game_details.",
      inputSchema: z.object({
        title: z.string().describe("Game title, e.g. 'Hollow Knight'."),
        limit: z.number().describe("Max results (default 8, max 20).").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await searchGames(args)) } catch (e) { return textError(error(e)) }
    }
  )
  server.registerTool(
    "game_details",
    {
      title: "Game details",
      description: "Compare one game's price across every store, plus its cheapest price ever.",
      inputSchema: z.object({
        gameID: z.string().describe("CheapShark gameID from search_games or deals."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await gameDetails(args)) } catch (e) { return textError(error(e)) }
    }
  )
  server.registerTool(
    "top_deals",
    {
      title: "Top deals",
      description: "The best current game deals ranked by CheapShark's deal rating, all stores or one store.",
      inputSchema: z.object({
        storeID: z.string().describe("Only this store, e.g. '1' for Steam.").optional(),
        limit: z.number().describe("Max results (default 8, max 25).").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await topDeals(args)) } catch (e) { return textError(error(e)) }
    }
  )
  server.registerTool(
    "free_games",
    {
      title: "Free games",
      description: "Games currently free (or 100% off) on any tracked store.",
      inputSchema: z.object({
        limit: z.number().describe("Max results (default 10, max 30).").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await freeGames(args)) } catch (e) { return textError(error(e)) }
    }
  )
  server.registerTool(
    "steam_lookup",
    {
      title: "Steam lookup",
      description: "Find a CheapShark game from its Steam AppID, with the current cheapest price and the gameID for game_details.",
      inputSchema: z.object({
        appID: z.string().describe("Numeric Steam AppID, e.g. 1245620 for ELDEN RING."),
        limit: z.number().describe("Max results (default 5, max 20).").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await steamLookup(args)) } catch (e) { return textError(error(e)) }
    }
  )

  server.registerTool(
    "filter_deals",
    {
      title: "Filter deals",
      description: "Deals filtered by price range, minimum Metacritic score, minimum Steam rating, on-sale or AAA games, sorted cheapest first or by rating.",
      inputSchema: z.object({
        minPrice: z.number().describe("Minimum sale price in USD.").optional(),
        maxPrice: z.number().describe("Maximum sale price in USD.").optional(),
        metacritic: z.number().describe("Only games with at least this Metacritic score.").optional(),
        steamRating: z.number().describe("Only games with at least this Steam rating percent, e.g. 80.").optional(),
        onSale: z.boolean().describe("Only deals that are discounted right now.").optional(),
        aaa: z.boolean().describe("Only AAA titles.").optional(),
        sort: z.string().describe("Deal Rating, Price, Savings, Metacritic, Reviews, Release or Recent.").optional(),
        limit: z.number().describe("Max results (default 10, max 25).").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await filterDeals(args)) } catch (e) { return textError(error(e)) }
    }
  )

  server.registerTool(
    "deal_market_scan",
    {
      title: "Deal market scan",
      description: "The shape of the current CheapShark deal page: discount buckets, sale-price bands, share of free titles and AAA-band scorers, Metacritic and Steam sentiment, and the biggest absolute discounts.",
      inputSchema: z.object({
        page_size: z.number().int().min(1).max(60).optional().describe("Accepted for symmetry; CheapShark serves one page of up to 60"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: deal_market_scan ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_cheapshark_deal_market_scan", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "store_leaderboard",
    {
      title: "Store leaderboard",
      description: "Which stores are discounting hardest in the current CheapShark page: deal count, median discount, median sale price, free-title count and Steam positivity per store.",
      inputSchema: z.object({
        page_size: z.number().int().min(1).max(60).optional().describe("Accepted for symmetry; CheapShark serves one page of up to 60"),
        top: z.number().int().min(1).max(35).default(12).describe("Stores to show, default 12"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: store_leaderboard ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_cheapshark_store_leaderboard", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "value_picks",
    {
      title: "Value picks",
      description: "The cheapest paid titles on the current CheapShark page, the deals giving the most discount per dollar spent, and any free titles that have a real retail price behind them.",
      inputSchema: z.object({
        top: z.number().int().min(1).max(25).default(8).describe("Rows per section, default 8"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await valuePicks(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
