import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  CocktailError,
  browseByLetter,
  cocktailDetail,
  listFilters,
  listIngredients,
  randomCocktail,
  searchCocktails,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof CocktailError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "thecocktaildb-mcp", version: "1.0.0" })
  const limit = z.number().int().min(1).max(50).default(10).describe("Drinks to return (1-50)")

  server.tool(
    "search_cocktails",
    "Find cocktails by name.",
    { name: z.string().min(2).describe("Cocktail name or part of it, e.g. 'margarita'"), limit },
    async ({ name, limit: n }) => {
      try {
        return text(await searchCocktails(name, n))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "cocktail_detail",
    "Full recipe: ingredients with measures, instructions, glass and image.",
    { id: z.string().min(3).describe("Numeric id from any list tool, e.g. 11007") },
    async ({ id }) => {
      try {
        return text(await cocktailDetail(id))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool("random_cocktail", "One random cocktail recipe.", {}, async () => {
    try {
      return text(await randomCocktail())
    } catch (e) {
      return text(errorMessage(e))
    }
  })

  server.tool(
    "browse_by_letter",
    "List cocktails whose name starts with one letter.",
    { letter: z.string().length(1).describe("A single letter a-z"), limit },
    async ({ letter, limit: n }) => {
      try {
        return text(await browseByLetter(letter, n))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_ingredients",
    "Ingredient names the free tier exposes, useful for guessing a search term.",
    { limit: z.number().int().min(10).max(100).default(100).describe("How many names (10-100)") },
    async ({ limit: n }) => {
      try {
        return text(await listIngredients(n))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool("list_filters", "Every category, glass and strength label used by TheCocktailDB.", {}, async () => {
    try {
      return text(await listFilters())
    } catch (e) {
      return text(errorMessage(e))
    }
  })

  return server
}
