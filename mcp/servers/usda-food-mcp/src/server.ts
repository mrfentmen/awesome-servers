import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { m0_search, m1_searchFood } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'usda-food-mcp', version: '1.0.0' })
server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search USDA foods.",
      inputSchema: z.object( { query: z.string().describe("Food search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_search(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "search_food",
    {
      title: "Search food",
      description: "Search foods by name and get nutrition facts.",
      inputSchema: z.object( { query: z.string().describe("Food name like banana."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_searchFood(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "food_details",
    {
      title: "Food details",
      description: "The USDA FoodData Central record for one FDC id: data type, brand, category, serving size and the published nutrient amounts.",
      inputSchema: z.object( { fdc_id: z.string().describe("Numeric FDC id, e.g. 173944 for raw bananas.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: food_details ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_usda_food_food_details", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
