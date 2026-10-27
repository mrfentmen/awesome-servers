import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  TcgError,
  formatCardDetail,
  formatCardSummary,
  formatSet,
  getCard,
  getSet,
  listSets,
  searchCards,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

export function createServer(): McpServer {
  const server = new McpServer({
    name: "pokemon-tcg-mcp",
    version: "1.0.0",
  })

  server.tool(
    "search_cards",
    "Search Pokémon TCG cards by name, optionally filtered by rarity.",
    {
      name: z.string().describe("Card name, e.g. 'Charizard' or 'Pikachu'"),
      rarity: z.string().optional().describe("e.g. 'Rare Holo', 'Common', 'Rare Holo EX'"),
      limit: z.number().int().min(1).max(25).default(12).describe("Max results"),
    },
    async ({ name, rarity, limit }) => {
      try {
        const cards = await searchCards(name, rarity, limit)
        if (cards.length === 0) {
          return text(`No cards found for "${name}"${rarity ? ` (${rarity})` : ""}.`)
        }
        return text(
          `Cards matching "${name}":\n` +
            cards.map((c, i) => `${i + 1}. ${formatCardSummary(c)}`).join("\n\n")
        )
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_card",
    "Get a single card's full detail: attacks, abilities, weakness, " +
      "variants, and market prices when available.",
    { id: z.string().describe("Card id from search_cards, e.g. 'swsh4-25'") },
    async ({ id }) => {
      try {
        const card = await getCard(id)
        if (!card) return text(`No card with id "${id}".`)
        return text(formatCardDetail(card))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_sets",
    "List Pokémon TCG sets (newest first).",
    {},
    async () => {
      try {
        const sets = await listSets()
        if (sets.length === 0) return text("No sets found.")
        return text(
          `Pokémon TCG sets (${sets.length}):\n` +
            sets.slice(0, 20).map((s, i) => `${i + 1}. ${formatSet(s)}`).join("\n")
        )
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_set",
    "Get a Pokémon TCG set and its card list.",
    { id: z.string().describe("Set id from list_sets, e.g. 'swsh4' or 'base1'") },
    async ({ id }) => {
      try {
        const set = await getSet(id)
        if (!set) return text(`No set with id "${id}".`)
        const head = `${formatSet(set)} (${set.cards.length} cards)\n`
        const body = set.cards
          .slice(0, 25)
          .map((c) => `• #${c.localId} ${c.name}${c.rarity ? ` (${c.rarity})` : ""}`)
          .join("\n")
        const tail = set.cards.length > 25 ? `\n…and ${set.cards.length - 25} more` : ""
        return text(head + body + tail)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof TcgError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
