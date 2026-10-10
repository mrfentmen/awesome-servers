import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { ScryfallError, formatCard, formatPrices, formatRuling, getCardByFuzzyName, getCardRulings, getRandomCard, getSets, searchCards, searchSet, cardsByCollection, cardBySetNumber, manaSymbols, cardAutocomplete } from "./api.js"
import { premiumTool } from "./gateway.js"
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

  server.registerTool(
    "cards_by_collection",
    {
      title: "Resolve a list of cards",
      description:
        "Resolve up to 75 card names in one request and report the total price plus any name that did not match, so a decklist is checked in one call.",
      inputSchema: z.object({
        names: z.array(z.string()).describe('Card names, e.g. ["Black Lotus", "Lightning Bolt"]'),
      }),
      annotations: READ_ONLY,
    },
    async ({ names }) => {
      try {
        return text(await cardsByCollection({ names }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "card_by_set_number",
    {
      title: "Card by set and number",
      description:
        "Fetch one exact printing by set code and collector number, e.g. lea 233 - the reliable way to a specific printing rather than a search result.",
      inputSchema: z.object({
        set: z.string().describe("Set code, e.g. 'lea' for Alpha or 'mh3'"),
        number: z.string().describe("Collector number, e.g. '233'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ set, number }) => {
      try {
        return text(await cardBySetNumber({ set, number }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "mana_symbols",
    {
      title: "Mana symbols",
      description:
        "Scryfall's symbology: every mana and counter symbol with its meaning, mana value and the SVG file, optionally filtered by symbol or wording.",
      inputSchema: z.object({
        query: z.string().describe("Filter, e.g. 'phyrexian' or '{W}'. Omit for all symbols.").optional(),
        limit: z.number().describe("How many to list, 1-200. Defaults to 40.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        return text(await manaSymbols({ query, limit }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "card_autocomplete",
    {
      title: "Complete a card name",
      description:
        "Turn a partial or misspelled card name into the real names Scryfall knows, for use in a search that would otherwise come back empty.",
      inputSchema: z.object({
        query: z.string().describe("Start of a card name, e.g. 'thran'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ query }) => {
      try {
        return text(await cardAutocomplete({ query }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "set_profile",
    {
      title: "Set profile",
      description:
        "What a set is actually made of: the card-type split, the colour identity distribution, a mana-value histogram with the average, and the rarity counts, all measured from the card rows.",
      inputSchema: z.object({
        code: z.string().describe("Set code, e.g. 'rix', 'm21' or 'dka'"),
        limit: z.number().describe("Max card rows to read, 10-900. Defaults to 400.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: set_profile ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_scryfall_set_profile", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "keyword_index",
    {
      title: "Keyword ability index",
      description:
        "Which keyword abilities a set actually uses, counted by searching Scryfall against its own 223-entry keyword catalog, with each keyword's share of the set.",
      inputSchema: z.object({
        code: z.string().describe("Set code, e.g. 'rix' or 'dka'"),
        limit: z.number().describe("How many catalogued keywords to search, 5-223. Defaults to 60.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: keyword_index ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_scryfall_keyword_index", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof ScryfallError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
