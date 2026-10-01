import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { byIngredient, cocktailDetails, searchCocktails, randomCocktail } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "cocktails-mcp", version: "1.0.0" })
  server.registerTool(
    "search_cocktails",
    {
      title: "Search cocktails",
      description: "Search cocktails by name.",
      inputSchema: z.object( { query: z.string().describe("Cocktail name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await searchCocktails(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "by_ingredient",
    {
      title: "By ingredient",
      description: "Find cocktails by ingredient.",
      inputSchema: z.object( { ingredient: z.string().describe("Ingredient name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await byIngredient(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "cocktail_details",
    {
      title: "Cocktail details",
      description: "Get a full cocktail recipe by ID.",
      inputSchema: z.object( { cocktailId: z.string().describe("Cocktail ID.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await cocktailDetails(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "filter_cocktails",
    {
      title: "Filter cocktails",
      description: "Browse TheCocktailDB by category, glass or strength, or list the values each facet offers. The existing tools only search by name or ingredient.",
      inputSchema: z.object( { facet: z.string().describe("One of category, glass or strength. Omit to see all three.").optional(), value: z.string().describe("Facet value to list, like Shot or Cocktail glass. Omit to see the values.").optional(), limit: z.number().describe("How many cocktails to list, 1-100. Defaults to 25.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: filter_cocktails ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_cocktails_filter_cocktails", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "shopping_list",
    {
      title: "Shopping list",
      description: "Merge the ingredients of several cocktails into one shopping list, flagging what more than one drink needs.",
      inputSchema: z.object( { ids: z.array(z.string()).describe("Cocktail ids, up to 12, like [\"11007\", \"11117\"].") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: shopping_list ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_cocktails_shopping_list", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "random_cocktail",
    {
      title: "Random cocktail",
      description: "One random cocktail with its full ingredient list and instructions.",
      inputSchema: z.object( {  } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await randomCocktail(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
