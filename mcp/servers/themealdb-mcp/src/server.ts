import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { m0_categories, m0_filterByIngredient, m0_random, m0_search, m1_byIngredient, m1_recipeDetails, m1_searchRecipes, listIngredients } from "./api.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'themealdb-mcp', version: '1.0.0' })
server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search meals by name.",
      inputSchema: z.object( { query: z.string().describe("Meal name query.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_search(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "random",
    {
      title: "Random",
      description: "Get a random meal.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_random(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "categories",
    {
      title: "Categories",
      description: "List meal categories.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_categories(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "filter_by_ingredient",
    {
      title: "Filter by ingredient",
      description: "Find meals by ingredient.",
      inputSchema: z.object( { ingredient: z.string().describe("Ingredient name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_filterByIngredient(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "search_recipes",
    {
      title: "Search recipes",
      description: "Search recipes by name.",
      inputSchema: z.object( { query: z.string().describe("Recipe name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_searchRecipes(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "by_ingredient",
    {
      title: "By ingredient",
      description: "Find recipes using a main ingredient.",
      inputSchema: z.object( { ingredient: z.string().describe("Ingredient name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_byIngredient(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "recipe_details",
    {
      title: "Recipe details",
      description: "Get the full recipe by ID.",
      inputSchema: z.object( { mealId: z.string().describe("Meal ID.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_recipeDetails(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "filter_by_category",
    {
      title: "Filter by category",
      description: "List meals in a TheMealDB category, such as Seafood, Dessert or Vegan.",
      inputSchema: z.object( { category: z.string().describe("Category name, e.g. Seafood."), limit: z.number().describe("Max meals.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement category locally (paywall removed)
    try { return textError("Not yet implemented: category") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "filter_by_area",
    {
      title: "Filter by area",
      description: "List meals from a TheMealDB culinary area, such as Canadian, Italian or Japanese.",
      inputSchema: z.object( { area: z.string().describe("Area name, e.g. Canadian."), limit: z.number().describe("Max meals.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement area locally (paywall removed)
    try { return textError("Not yet implemented: area") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "list_ingredients",
    {
      title: "List ingredients",
      description: "Every ingredient TheMealDB indexes, with a bounded slice of the catalogue.",
      inputSchema: z.object( { limit: z.number().describe("Max ingredients.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await listIngredients(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
