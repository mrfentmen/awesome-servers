import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { formatGuild, formatItem, formatPlayer, getGuild, getPlayer, searchItems, WynncraftError, mapLocations } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "wynncraft-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_player",
    {
      title: "Get player profile",
      description: "Get a Wynncraft player profile: rank, online status, guild, playtime, characters.",
      inputSchema: z.object({
        name: z.string().describe("Minecraft username, e.g. 'Salted'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ name }) => {
      try {
        return text(formatPlayer(await getPlayer(name)))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_guild",
    {
      title: "Get guild info",
      description: "Get a Wynncraft guild: level, territories, wars, member counts by rank.",
      inputSchema: z.object({
        name: z.string().describe("Guild name, e.g. 'Wynncraft'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ name }) => {
      try {
        return text(formatGuild(await getGuild(name)))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "search_items",
    {
      title: "Search items",
      description: "Search the Wynncraft item database by name: weapons, armour, accessories with tier and level requirement.",
      inputSchema: z.object({
        query: z.string().describe("Item name to search, e.g. 'discoverer'"),
        limit: z.number().int().min(1).max(20).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        const results = await searchItems(query, limit)
        if (results.length === 0) return text(`No Wynncraft items match "${query}".`)
        return text(`Wynncraft items for "${query}":\n\n${results.map((it, i) => formatItem(it, i)).join("\n")}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "item_build",
    {
      title: "Item build stats",
      description: "Build data for Wynncraft items matching a name: level and class requirements, stat requirements and identifications, elements, powder slots, emblem and average DPS.",
      inputSchema: z.object({
        query: z.string().describe("Item name, e.g. \"Idol\" or \"Pareidolia\""),
        limit: z.number().int().min(1).max(10).default(5),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: item_build ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_wynncraft_item_build", args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "map_locations",
    {
      title: "Map locations",
      description: "Find Wynncraft map locations and profession stations by name, with their coordinates.",
      inputSchema: z.object( { query: z.string().describe("Optional location name filter.").optional(), limit: z.number().optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await mapLocations(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "territory_owners",
    {
      title: "Territory owners",
      description: "List territory ownership, acquisition times and headquarters flags, optionally filtered by guild.",
      inputSchema: z.object( { guild: z.string().describe("Optional guild name filter.").optional(), limit: z.number().optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: territory_owners ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_wynncraft_territory_owners", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof WynncraftError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
