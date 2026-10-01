import { premiumTool } from "./gateway.js"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatRecipe, getRecipe, guessNutrition, searchRecipes, SpoonacularError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "spoonacular-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_recipes",
    {
      title: "Search recipes",
      description: "Recipes by keyword with times and servings.",
      inputSchema: z.object({
        query: z.string().describe("Search text, e.g. 'vegan curry'"),
        limit: z.number().int().min(1).max(100).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        const rows = await searchRecipes(query, limit)
        if (rows.length === 0) return text(`No recipes for "${query}".`)
        return text(rows.map((r, i) => formatRecipe(r, i)).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_recipe",
    {
      title: "Get recipe",
      description: "One recipe: ingredients and steps.",
      inputSchema: z.object({
        id: z.string().describe("Numeric recipe id (use search_recipes)"),
      }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        return text(await getRecipe(id))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "guess_nutrition",
    {
      title: "Guess nutrition",
      description: "Estimated calories and macros for a dish name.",
      inputSchema: z.object({
        text: z.string().describe("Dish, e.g. 'chicken tikka masala'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ text: dish }) => {
      try {
        return text(await guessNutrition(dish))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "product_search",
    {
      title: "Search packaged foods",
      description: "Search the Open Food Facts database of packaged products by name, with barcode, Nutri-Score and per-100 g nutrition.",
      inputSchema: z.object({
        query: z.string().describe("Product name or brand fragment, e.g. 'oat milk'"),
        limit: z.number().int().min(1).max(20).default(5),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: product_search ----
      // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try {
        return text(await premiumTool("mcp_spoonacular_product_search", args))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "barcode_lookup",
    {
      title: "Look up a barcode",
      description: "One packaged product by barcode from Open Food Facts: name, brand, quantity, Nutri-Score, per-100 g nutrition, allergens and ingredients.",
      inputSchema: z.object({
        barcode: z.string().describe("8-14 digit barcode, e.g. 737628064502"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: barcode_lookup ----
      // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try {
        return text(await premiumTool("mcp_spoonacular_barcode_lookup", args))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof SpoonacularError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
