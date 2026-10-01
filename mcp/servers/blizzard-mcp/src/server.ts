import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { BlizzardError, diabloSeasons, wowAchievements, wowTokenPrice, resetCalendar } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const region = z.enum(["us", "eu", "kr", "tw"]).default("us")

export function createServer(): McpServer {
  const server = new McpServer({
    name: "blizzard-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "wow_token_price",
    {
      title: "WoW token price",
      description: "Current WoW Token gold price for a region.",
      inputSchema: z.object({ region }),
      annotations: READ_ONLY,
    },
    async ({ region: rg }) => {
      try {
        return text(await wowTokenPrice(rg))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "wow_achievements",
    {
      title: "WoW achievements",
      description: "Sample World of Warcraft achievements with ids.",
      inputSchema: z.object({
        region,
        limit: z.number().int().min(1).max(50).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ region: rg, limit }) => {
      try {
        const rows = await wowAchievements(rg, limit)
        if (rows.length === 0) return text("No achievements.")
        return text(rows.map((a, i) => `${i + 1}. [${a.id}] ${a.name}`).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "diablo_seasons",
    {
      title: "Diablo seasons",
      description: "Recent Diablo 3 seasons (newest first).",
      inputSchema: z.object({ region }),
      annotations: READ_ONLY,
    },
    async ({ region: rg }) => {
      try {
        const rows = await diabloSeasons(rg)
        if (rows.length === 0) return text("No seasons.")
        return text(rows.map((s, i) => `${i + 1}. Season ${s.id}`).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "reset_calendar",
    {
      title: "Realm reset calendar",
      description: "When your daily reset lands, in your own timezone: server time for the region, the next few reset timestamps and countdowns, and the weekly maintenance window, all with correct daylight saving. Computed locally, no Battle.net credentials.",
      inputSchema: z.object({
        region: z.enum(["us", "eu", "kr", "tw"]).describe("Region the realm is in"),
        timezone: z.string().optional().describe("Your IANA timezone, e.g. Europe/London. Default the region's server clock."),
        reset_hour: z.number().int().min(0).max(23).optional().describe("Override the daily reset hour in server time"),
        weeks: z.number().int().min(1).max(4).default(1).describe("How many resets to list"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await resetCalendar(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "stat_weights",
    {
      title: "Score gear by weights",
      description: "Rank a set of items you paste by how much each stat is worth to you, show the arithmetic behind every score, pick a winner per slot and list the stats you are ignoring. Pure arithmetic, no game data needed.",
      inputSchema: z.object({
        items: z.array(z.object({
          name: z.string().describe("Item name"),
          slot: z.string().optional().describe("Slot it goes in, e.g. head"),
          stats: z.string().describe("Stats as 'name: value' pairs, e.g. 'crit: 42, haste: 88'"),
        })).describe("The items to compare"),
        weights: z.record(z.string(), z.number()).describe("What each stat is worth, e.g. {\"crit\": 1, \"haste\": 0.8}"),
        slots: z.array(z.string()).optional().describe("Slots to report a winner for, default every slot seen"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: stat_weights ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_blizzard_stat_weights", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof BlizzardError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
