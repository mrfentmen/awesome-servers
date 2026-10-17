import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { cards, sets } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "mtg-mcp", version: "1.0.0" })
  server.registerTool(
    "cards",
    {
      title: "Cards",
      description: "Search cards.",
      inputSchema: z.object( { name: z.string().describe("Card name."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await cards(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "sets",
    {
      title: "Sets",
      description: "List card sets.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await sets(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "card_profile",
    {
      title: "Card profile",
      description: "Full Scryfall record for one exact card name: mana cost, type line, oracle and flavour text, power/toughness, colours, keywords, format legality, prices, EDHREC rank, artist and image link.",
      inputSchema: z.object({ name: z.string().describe("Exact card name, e.g. 'Shivan Dragon'."), }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement profile locally (paywall removed)
    try { return textError("Not yet implemented: profile") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "card_rulings",
    {
      title: "Card rulings",
      description: "Official rule clarifications Scryfall records for a card, with the date each was published.",
      inputSchema: z.object({ name: z.string().describe("Exact card name, e.g. 'Fling'."), limit: z.number().describe("Max rulings, 1-40, default 8.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement rulings locally (paywall removed)
    try { return textError("Not yet implemented: rulings") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "keyword_list",
    {
      title: "Keyword list",
      description: "The keyword ability names in Scryfall's catalogue, as a reference for reading card text.",
      inputSchema: z.object({  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement list locally (paywall removed)
    try { return textError("Not yet implemented: list") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
