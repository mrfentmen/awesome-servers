import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  MealError,
  byArea,
  byCategory,
  byMainIngredient,
  listOptions,
  mealDetail,
  randomMeal,
  searchMeals,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof MealError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "themealdb-mcp", version: "1.0.0" })
  const limit = z.number().int().min(1).max(50).default(10).describe("Meals to return (1-50)")

  server.tool(
    "search_meals",
    "Find recipes by name.",
    { name: z.string().min(2).describe("Dish name or part of it, e.g. 'curry'"), limit },
    async ({ name, limit: n }) => {
      try {
        return text(await searchMeals(name, n))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "meal_detail",
    "Full recipe: ingredients with measures, numbered steps, video and image.",
    { id: z.string().min(4).describe("Numeric id from any list tool, e.g. 52772") },
    async ({ id }) => {
      try {
        return text(await mealDetail(id))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool("random_meal", "One random recipe.", {}, async () => {
    try {
      return text(await randomMeal())
    } catch (e) {
      return text(errorMessage(e))
    }
  })

  server.tool(
    "meals_by_category",
    "All recipes in one category, e.g. 'Seafood', 'Dessert', 'Vegetarian'.",
    { category: z.string().min(2).describe("Category from list_options"), limit },
    async ({ category, limit: n }) => {
      try {
        return text(await byCategory(category, n))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "meals_by_cuisine",
    "All recipes from one cuisine, e.g. 'Italian', 'Thai', 'Mexican'.",
    { area: z.string().min(2).describe("Cuisine from list_options"), limit },
    async ({ area, limit: n }) => {
      try {
        return text(await byArea(area, n))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "meals_by_ingredient",
    "Recipes whose main ingredient is one you name, e.g. 'chicken breast'.",
    { ingredient: z.string().min(2).describe("Main ingredient name"), limit },
    async ({ ingredient, limit: n }) => {
      try {
        return text(await byMainIngredient(ingredient, n))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool("list_options", "Every category, cuisine and ingredient name you can filter by.", {}, async () => {
    try {
      return text(await listOptions())
    } catch (e) {
      return text(errorMessage(e))
    }
  })

  return server
}
