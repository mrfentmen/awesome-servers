import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { errorMessage, getBrNews, getBrShop, getMap, getAes, searchCosmetic, getPlaylists } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const NON_READ_ONLY = { openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "fortnite-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_br_news",
    {
      title: "Get BR news",
      description: "Current Fortnite battle royale news entries with images and tab titles.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getBrNews());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_br_shop",
    {
      title: "Get item shop",
      description: "Current Fortnite item shop entries: cosmetics, prices in V-Bucks, bundles.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getBrShop());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_map",
    {
      title: "Get island map",
      description: "Current Fortnite island map images plus points of interest.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getMap());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_aes",
    {
      title: "Get AES keys",
      description: "Current Fortnite AES encryption keys for datamining pak files.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getAes());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "search_cosmetic",
    {
      title: "Search cosmetics",
      description: "Search Fortnite cosmetics by name: skins, emotes, pickaxes, gliders with rarity and images.",
      inputSchema: z.object({
        name: z.string().describe("Cosmetic name, e.g. 'Renegade Raider'"),
        language: z.string().default("en").describe("Response language"),
      }),
      annotations: READ_ONLY,
    },
    async ({ name, language }) => {
      try {
        return text(await searchCosmetic(name, language));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_playlists",
    {
      title: "Get playlists",
      description: "All Fortnite playlists/game modes with images and player counts.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getPlaylists());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "cosmetics_by_type",
    {
      title: "Cosmetics by type",
      description: "Browse Fortnite's br cosmetic catalogue by type (character, back, pickaxe, glider, wrap, emote, contrail) with rarity, price and set, which name search alone cannot enumerate.",
      inputSchema: z.object( { type: z.string().describe("Cosmetic type, e.g. character or pickaxe."), limit: z.number().describe("Max cosmetics.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: cosmetics_by_type ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_fortnite_cosmetics_by_type", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "cosmetic_detail",
    {
      title: "Cosmetic detail",
      description: "One Fortnite cosmetic's full record by id: type, rarity, v-buck price, set, and the season and chapter it was introduced in.",
      inputSchema: z.object( { id: z.string().describe("Cosmetic id, e.g. Character_Squidward."), }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: cosmetic_detail ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_fortnite_cosmetic_detail", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}
