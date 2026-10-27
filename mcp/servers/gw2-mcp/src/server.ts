import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  Gw2Error,
  formatAchievement,
  formatItem,
  formatPrice,
  getAchievement,
  getDailyAchievements,
  getItem,
  getItemPrice,
  searchItems,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

export function createServer(): McpServer {
  const server = new McpServer({
    name: "gw2-mcp",
    version: "1.0.0",
  })

  server.tool(
    "search_items",
    "Search Guild Wars 2 items by name.",
    { name: z.string().describe("Item name, e.g. 'Zojja' or 'Eternal Forge'"), limit: z.number().int().min(1).max(20).default(10) },
    async ({ name, limit }) => {
      try {
        const items = await searchItems(name, limit)
        if (items.length === 0) return text(`No GW2 items match "${name}".`)
        return text(`Items matching "${name}":\n\n${items.map((i) => formatItem(i)).join("\n\n")}`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_item",
    "Get a GW2 item by id.",
    { id: z.number().int().describe("Item id from search_items") },
    async ({ id }) => {
      try {
        const item = await getItem(id)
        if (!item) return text(`No item ${id}.`)
        return text(formatItem(item))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_item_price",
    "Trading Post buy and sell prices for an item.",
    { id: z.number().int().describe("Item id") },
    async ({ id }) => {
      try {
        const price = await getItemPrice(id)
        if (!price) return text(`No trading data for item ${id}.`)
        return text(`Trading Post for ${id}:\n${formatPrice(price)}`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_achievement",
    "Get a GW2 achievement by id.",
    { id: z.number().int().describe("Achievement id") },
    async ({ id }) => {
      try {
        const a = await getAchievement(id)
        if (!a) return text(`No achievement ${id}.`)
        return text(formatAchievement(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_daily_achievements",
    "Today's PvE daily achievements.",
    {},
    async () => {
      try {
        const daily = await getDailyAchievements()
        if (daily.length === 0) return text("No dailies available.")
        const out: string[] = []
        for (const d of daily) {
          const a = await getAchievement(d.id)
          if (a) out.push(`- ${a.name}${d.level_min ? ` (lvl ${d.level_min}+)` : ""}`)
        }
        return text(`Today's GW2 dailies:\n${out.join("\n")}`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof Gw2Error) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
