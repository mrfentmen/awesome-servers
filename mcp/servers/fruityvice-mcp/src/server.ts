import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { allFruits, fruitByName, fruitsByNutrient, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "fruityvice-mcp", version: "1.0.1" })

  server.tool(
    "all_fruits",
    "The whole fruit catalogue with nutrition per 100 g.",
    {
      limit: z.number().int().min(1).max(60).default(20).describe("Fruits to return")
    },
    async (a) => {
      try {
        return text(await allFruits(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "fruit_by_name",
    "One fruit by name, with family, genus and nutrition.",
    {
      name: z.string().min(2).describe("Fruit name, e.g. strawberry or mango")
    },
    async (a) => {
      try {
        return text(await fruitByName(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "fruits_by_nutrient",
    "Fruits whose nutrient value falls inside a range.",
    {
      nutrient: z.enum(["calories", "fat", "sugar", "carbohydrates", "protein"]).describe("Nutrient to filter on"),
      min: z.number().min(0).describe("Minimum value per 100 g"),
      max: z.number().min(0).describe("Maximum value per 100 g"),
      limit: z.number().int().min(1).max(30).default(10).describe("Fruits to return")
    },
    async (a) => {
      try {
        return text(await fruitsByNutrient(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
