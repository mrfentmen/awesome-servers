import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, searchCocktails, getCocktail, randomCocktail, listIngredients, filterCocktails, ingredientInfo, listFilters, searchByLetter, filterMultiIngredient } from "./api.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "cocktaildb-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_cocktails",
    {
      title: "Search cocktails",
      description:
        "Find cocktails by name. Returns matching drinks with their category, glass and id — pass an id to get_cocktail for the full recipe.",
      inputSchema: z.object({
        query: z.string().describe("Cocktail name, e.g. margarita."),
        limit: z.number().describe("How many matches to list, 1-25 (default 10).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        return text(await searchCocktails({ query, limit }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_cocktail",
    {
      title: "Get cocktail",
      description:
        "Full recipe for one drink: ingredients with measures, instructions, glass, category and image URL. Needs a drink id from search_cocktails or filter_cocktails.",
      inputSchema: z.object({
        drink_id: z.string().describe("Drink id, e.g. 11007.")
      }),
      annotations: READ_ONLY,
    },
    async ({ drink_id }) => {
      try {
        return text(await getCocktail(drink_id))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "random_cocktail",
    {
      title: "Random cocktail",
      description: "One or more random cocktail recipes, useful for suggestions and inspiration.",
      inputSchema: z.object({
        count: z.number().describe("How many random recipes, 1-3 (default 1).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ count }) => {
      try {
        return text(await randomCocktail(count))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_ingredients",
    {
      title: "List ingredients",
      description:
        "Known ingredients in the cocktail database, optionally filtered by a substring. Use the exact names with filter_cocktails and ingredient_info.",
      inputSchema: z.object({
        search: z.string().describe("Substring to filter ingredient names, e.g. vodka.").optional(),
        limit: z.number().describe("How many names to list, 1-200 (default 40).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ search, limit }) => {
      try {
        return text(await listIngredients({ search, limit }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "filter_cocktails",
    {
      title: "Filter cocktails",
      description:
        "Browse cocktails by one attribute: an ingredient they contain, a category, a glass type, or an alcohol option. Returns drink names with ids.",
      inputSchema: z.object({
        by: z.string().describe("ingredient, category, glass, or alcohol."),
        value: z.string().describe("Value to match, e.g. Gin, Cocktail, Cocktail glass, Non alcoholic."),
        limit: z.number().describe("How many drinks to list, 1-50 (default 20).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ by, value, limit }) => {
      try {
        return text(await filterCocktails({ by, value, limit }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "ingredient_info",
    {
      title: "Ingredient info",
      description:
        "Profile of one ingredient: type, whether it contains alcohol, ABV, and a description of what it is.",
      inputSchema: z.object({
        name: z.string().describe("Ingredient name, e.g. Gin.")
      }),
      annotations: READ_ONLY,
    },
    async ({ name }) => {
      try {
        return text(await ingredientInfo(name))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_filters",
    {
      title: "List filters",
      description:
        "The valid values for filter_cocktails: drink categories, glass types and alcohol options.",
      inputSchema: z.object({
        kind: z.string().describe("categories, glasses, alcohol, or all (default all).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ kind }) => {
      try {
        return text(await listFilters(kind))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "search_by_letter",
    {
      title: "Browse by letter",
      description:
        "List every cocktail whose name starts with one letter, for browsing the database alphabetically.",
      inputSchema: z.object({
        letter: z.string().describe("Single letter a-z, e.g. m."),
        limit: z.number().describe("How many drinks to list, 1-50 (default 20).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ letter, limit }) => {
      try {
        return text(await searchByLetter(letter, limit))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "filter_multi_ingredient",
    {
      title: "Filter by several ingredients",
      description:
        "Cocktails that contain all of the listed ingredients at once, e.g. Gin and Tonic water — the recipe finder for what is already in the bar.",
      inputSchema: z.object({
        ingredients: z.string().describe("Two to six ingredient names, comma separated, e.g. Gin,Tonic water."),
        limit: z.number().describe("How many drinks to list, 1-50 (default 20).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ ingredients, limit }) => {
      try {
        return text(await filterMultiIngredient(ingredients, limit))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}
