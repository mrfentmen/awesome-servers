import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { hot, iced, search, drinksWithIngredient } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "coffee-mcp", version: "1.0.0" })
  server.registerTool(
    "hot",
    {
      title: "Hot",
      description: "Hot coffee drinks.",
      inputSchema: z.object( { limit: z.number().describe("Maximum results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await hot(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "iced",
    {
      title: "Iced",
      description: "Iced coffee drinks.",
      inputSchema: z.object( { limit: z.number().describe("Maximum results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await iced(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search drinks by keyword.",
      inputSchema: z.object( { query: z.string().describe("Keyword."), limit: z.number().describe("Maximum results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "drink_detail",
    {
      title: "Drink detail",
      description: "One coffee drink by name with its full untruncated description, ingredients and image.",
      inputSchema: z.object( { name: z.string().describe("Drink name, e.g. Cortado.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: drink_detail ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_coffee_drink_detail", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "drinks_with_ingredient",
    {
      title: "Drinks with ingredient",
      description: "Every coffee drink in the catalogue that lists an ingredient, hot and iced.",
      inputSchema: z.object( { ingredient: z.string().describe("Ingredient, e.g. Espresso."), limit: z.number().describe("Max drinks.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await drinksWithIngredient(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "ingredient_index",
    {
      title: "Ingredient index",
      description: "Every distinct ingredient across the whole catalogue with the number of drinks using it.",
      inputSchema: z.object( { limit: z.number().describe("Max ingredients.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: ingredient_index ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_coffee_ingredient_index", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
