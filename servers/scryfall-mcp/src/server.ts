import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  ScryfallError,
  formatCard,
  formatPrices,
  formatRuling,
  getCardByFuzzyName,
  getCardRulings,
  getRandomCard,
  getSets,
  searchCards,
  searchSet,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "scryfall-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_cards",
    {
      title: "Search cards",
      description: "Search Magic: The Gathering cards by Scryfall syntax — card name, " +
      "oracle text, color, type, e.g. 'c:red type:dragon', " +
      "'o:\"when ~ enters\" legendary creature'.",
      inputSchema: z.object(
    { query: z.string().describe("Scryfall search query") }),
      annotations: READ_ONLY,
    },
    async ({ query }) => {
      try {
        const cards = await searchCards(query)
        if (cards.length === 0) return text(`No cards match "${query}".`)
        return text(`Cards matching "${query}":\n\n${cards.map((c, i) => formatCard(c, i)).join("\n\n")}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_card",
    {
      title: "Get card",
      description: "Get a single card by fuzzy name (e.g. 'bolas citadel' → Bolas's Citadel).",
      inputSchema: z.object(
    { name: z.string().describe("Card name (fuzzy match ok)") }),
      annotations: READ_ONLY,
    },
    async ({ name }) => {
      try {
        const card = await getCardByFuzzyName(name)
        if (!card) return text(`No card named "${name}".`)
        return text(formatCard(card))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_rulings",
    {
      title: "Get rulings",
      description: "Get official Gatherer rulings for a card by fuzzy name.",
      inputSchema: z.object(
    { name: z.string().describe("Card name, e.g. Lightning Bolt") }),
      annotations: READ_ONLY,
    },
    async ({ name }) => {
      try {
        const card = await getCardByFuzzyName(name)
        if (!card) return text(`No card named "${name}".`)
        const rulings = await getCardRulings(card.id)
        if (rulings.length === 0) return text(`${card.name} has no rulings on file.`)
        return text(`Rulings for ${card.name}:\n${rulings.map(formatRuling).join("\n")}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_sets",
    {
      title: "List sets",
      description: "List recent Magic sets with release dates and card counts.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const sets = await getSets()
        return text(
          `Recent Magic sets:\n` +
            sets
              .map(
                (s, i) =>
                  `${i + 1}. ${s.name} [${s.code}] (${s.set_type ?? "?"})${
                    s.released_at ? `, ${s.released_at}` : ""
                  }${s.card_count ? `, ${s.card_count} cards` : ""}`
              )
              .join("\n")
        )
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "random_card",
    {
      title: "Random card",
      description: "Get one random Magic card — good for deck ideas, cube picks and discovery.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        return text(await formatCard(await getRandomCard()))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "set_cards",
    {
      title: "Set cards",
      description: "List the cards in one Magic set by set code, e.g. 'dmu', 'blb', 'mh3'.",
      inputSchema: z.object({
        set_code: z.string().describe("Three-to-five letter set code, e.g. 'dmu'. See list_sets."),
        limit: z.number().int().min(1).max(40).default(20).describe("How many cards to show"),
      }),
      annotations: READ_ONLY,
    },
    async ({ set_code, limit }) => {
      try {
        const { total, cards } = await searchSet(set_code, limit)
        if (!cards.length) return text(`No cards found for set "${set_code}". Check the code with list_sets.`)
        return text(
          `Set "${set_code}" — ${total.toLocaleString()} cards, showing ${cards.length}:\n\n` +
            cards.map((c, i) => formatCard(c, i)).join("\n\n")
        )
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "card_price",
    {
      title: "Card price",
      description: "Current market prices for a card across TCGplayer (USD, foil and non-foil), Cardmarket (EUR) and MTGO (tix).",
      inputSchema: z.object(
    { name: z.string().describe("Card name (fuzzy match ok)") }),
      annotations: READ_ONLY,
    },
    async ({ name }) => {
      try {
        const card = await getCardByFuzzyName(name)
        if (!card) return text(`No card named "${name}".`)
        return text(formatPrices(card))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof ScryfallError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
