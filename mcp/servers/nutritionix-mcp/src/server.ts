import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { analyzeMeal, formatFood, NutritionixError, searchFoods } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "nutritionix-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_foods",
    {
      title: "Search foods",
      description: "Foods by name with calories and macros where known.",
      inputSchema: z.object({
        query: z.string().describe("Food, e.g. 'banana', 'big mac'"),
        limit: z.number().int().min(1).max(20).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        const rows = await searchFoods(query, limit)
        if (rows.length === 0) return text(`No foods for "${query}".`)
        return text(rows.map((f, i) => formatFood(f, i)).join("\n"))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "analyze_meal",
    {
      title: "Analyze meal",
      description: "Nutrients for free-text meal descriptions like '2 eggs and toast'.",
      inputSchema: z.object({
        text: z.string().describe("Meal description"),
      }),
      annotations: READ_ONLY,
    },
    async ({ text: meal }) => {
      try {
        const rows = await analyzeMeal(meal)
        if (rows.length === 0) return text("Nothing recognized.")
        const total = rows.reduce((n, f) => n + (f.calories ?? 0), 0)
        return text(`${rows.map((f, i) => formatFood(f, i)).join("\n")}\n\nTotal: ${Math.round(total)} kcal`)
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "nutrient_food_search",
    {
      title: "Search USDA foods",
      description: "Search USDA FoodData Central for a food and get its real per-100 g energy, macros, fibre, sugars, sodium, calcium and iron.",
      inputSchema: z.object({
        query: z.string().describe("Food name, e.g. 'oat milk', 'cheddar cheese'"),
        limit: z.number().int().min(1).max(20).default(5),
        branded: z.boolean().default(false).describe("Also search packaged branded food, whose nutrient data is often missing"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try {
        // TODO: implement search locally (paywall removed)
        try { return textError("Not yet implemented: search") } catch (e) { return textError(String(e)) }
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "nutrient_food_profile",
    {
      title: "USDA food nutrient profile",
      description: "Full nutrient profile for one FoodData Central food by FDC id: macros, sugars, fibre, sodium, calcium, iron plus vitamins and minerals.",
      inputSchema: z.object({
        fdcId: z.string().describe("Numeric FDC id from nutrient_food_search, e.g. 2257046"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try {
        // TODO: implement profile locally (paywall removed)
        try { return textError("Not yet implemented: profile") } catch (e) { return textError(String(e)) }
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof NutritionixError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
