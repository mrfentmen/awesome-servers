import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { m0_hiscore, m1_OsrsError, m1_formatStats, m1_getHotItems, m1_getItemPrice, m1_getPlayerStats, wikiOutline } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

const m1_MODES = ["normal", "ironman", "ultimate", "hardcore", "deadman"] as const

export function createServer(): McpServer {
  const server = new McpServer({ name: 'runescape-mcp', version: '1.0.0' })
server.registerTool(
    "hiscore",
    {
      title: "Hiscore",
      description: "Hiscore for a player.",
      inputSchema: z.object( { player: z.string().describe("Player name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_hiscore(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "get_player_stats",
    {
      title: "Get player stats",
      description: "Get an OSRS player's hiscores: levels, XP, clue scrolls, and boss " +
      "kill counts. Modes: normal / ironman / ultimate / hardcore / deadman.",
      inputSchema: z.object(
    {
      username: z.string().describe("RuneScape username, e.g. 'Zezima'"),
      mode: z.enum(m1_MODES).default("normal").describe("Account type"),
    }),
      annotations: READ_ONLY,
    },
    async ({ username, mode }) => {
      try {
        const stats = await m1_getPlayerStats(username, mode)
        return text(m1_formatStats(stats))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )
server.registerTool(
    "get_item_price",
    {
      title: "Get item price",
      description: "Get the current Grand Exchange price of an item (buy/sell spread).",
      inputSchema: z.object(
    { name: z.string().describe("Item name, e.g. 'Bandos chestplate' or 'Rune scimitar'") }),
      annotations: READ_ONLY,
    },
    async ({ name }) => {
      try {
        const p = await m1_getItemPrice(name)
        if (!p) return text(`No GE item matches "${name}". Try 'osrs get_item_price' with a different name.`)
        const lines = [
          `${p.name} [id ${p.id}]${p.members ? " (members)" : " (free)"}`,
          `Buy: ${p.high > 0 ? p.high.toLocaleString() + " gp" : "no trade today"}`,
          `Sell: ${p.low > 0 ? p.low.toLocaleString() + " gp" : "no trade today"}`,
          `Spread: ${p.high > 0 && p.low > 0 ? (p.high - p.low).toLocaleString() + " gp" : "—"}`,
        ]
        return text(lines.join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )
server.registerTool(
    "get_hot_items",
    {
      title: "Get hot items",
      description: "What's trading the most on the Grand Exchange right now — ranked by " +
      "trade volume in the last hour, with current buy/sell averages.",
      inputSchema: z.object(
    { limit: z.number().int().min(3).max(15).default(10).describe("How many items to show") }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        const items = await m1_getHotItems(limit)
        if (items.length === 0) return text("No trade volume data right now.")
        return text(
          `🔥 Hottest GE items (last hour):\n` +
            items
              .map(
                (m, i) =>
                  `${i + 1}. ${m.name} — vol ${m.volume.toLocaleString()} | buy ${m.avgHigh > 0 ? m.avgHigh.toLocaleString() + " gp" : "—"} / sell ${m.avgLow > 0 ? m.avgLow.toLocaleString() + " gp" : "—"}`
              )
              .join("\n")
        )
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )
  server.registerTool(
    "wiki_article",
    {
      title: "Wiki article",
      description: "The introduction of an Old School RuneScape Wiki article, with its categories and URL. Resolves a loose topic to the right page.",
      inputSchema: z.object( { topic: z.string().describe("Item, NPC, quest or mechanic to look up, e.g. 'Fire cape'."), maxChars: z.number().int().describe("Max characters of introduction to return.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: wiki_article ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_runescape_wiki_article", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "wiki_outline",
    {
      title: "Wiki outline",
      description: "The section headings of an Old School RuneScape Wiki article, with each section's index — use it to see how a long page is structured before fetching it.",
      inputSchema: z.object( { topic: z.string().describe("Item, NPC, quest or mechanic to look up, e.g. 'Fire cape'."), limit: z.number().int().describe("Max section headings to return.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await wikiOutline(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}
