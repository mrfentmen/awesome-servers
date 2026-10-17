import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { draw, newDeck, reshuffle } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "deck-of-cards-mcp", version: "1.0.0" })
  server.registerTool(
    "new_deck",
    {
      title: "New deck",
      description: "Create and shuffle a deck.",
      inputSchema: z.object( { decks: z.number().describe("Number of decks, 1 to 8.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await newDeck(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "draw",
    {
      title: "Draw",
      description: "Draw cards from a deck.",
      inputSchema: z.object( { deckId: z.string().describe("Deck ID."), count: z.number().describe("Cards to draw.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await draw(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "build_deck",
    {
      title: "Build deck",
      description: "Build a deck from exactly the named cards instead of the whole 52, optionally shuffled. Card codes are checked here first because the API accepts a code it does not know and silently returns an empty deck.",
      inputSchema: z.object( { cards: z.string().describe("Cards separated by commas, like AS,KD,0H for the ace of spades, king of diamonds and ten of hearts."), shuffle: z.boolean().describe("Shuffle the partial deck. Defaults to false.").optional(), deckCount: z.number().describe("How many copies of those cards to include, 1-8. Defaults to 1.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement deck locally (paywall removed)
    try { return textError("Not yet implemented: deck") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "reshuffle",
    {
      title: "Reshuffle",
      description: "Shuffle the cards still in a deck after some have been drawn, using the deck ID another tool returned.",
      inputSchema: z.object( { deckId: z.string().describe("Deck ID, as returned by new_deck or build_deck.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await reshuffle(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
