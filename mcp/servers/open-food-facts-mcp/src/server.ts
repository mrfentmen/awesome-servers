import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { FoodError, format, product, search } from "./api.js"
const text = (s: string) => ({ content: [{ type: "text" as const, text: s }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
export function createServer() { const server = new McpServer({ name: "open-food-facts-mcp", version: "1.0.0" }); server.registerTool(
    "get_product",
    {
      title: "Get product",
      description: "Look up a food product by barcode, ingredients, allergens, and nutrition.",
      inputSchema: z.object( { barcode: z.string().min(4) }),
      annotations: READ_ONLY,
    },
    async ({ barcode }) => { try { return text(format(await product(barcode))) } catch (e) { return textError(`Error: ${e instanceof Error ? e.message : String(e)}`) } }
  ); server.registerTool(
    "search_products",
    {
      title: "Search products",
      description: "Search Open Food Facts products by text. Results are intentionally small to respect the public service.",
      inputSchema: z.object( { query: z.string().min(1), page: z.number().int().min(1).max(20).default(1) }),
      annotations: READ_ONLY,
    },
    async ({ query, page }) => { try { return text(format(await search(query, String(page)))) } catch (e) { return textError(`Error: ${e instanceof Error ? e.message : String(e)}`) } }
  );
  server.registerTool(
    "ingredient_search",
    {
      title: "Ingredient search",
      description: "Find Open Food Facts products that list an ingredient, which the barcode and product-name searches cannot do.",
      inputSchema: z.object( { ingredient: z.string().describe("Ingredient, e.g. coconut."), limit: z.number().describe("Max products.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement search locally (paywall removed)
    try { return textError("Not yet implemented: search") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "tag_search",
    {
      title: "Tag search",
      description: "Find Open Food Facts products by category, label, country, packaging or trace tag, which is how you browse a diet or a market.",
      inputSchema: z.object( { tag: z.string().describe("Tag value, e.g. chocolate."), tagType: z.string().describe("categories, labels, countries, packaging, nutriments, states, traces or ingredients.").optional(), limit: z.number().describe("Max products.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement search locally (paywall removed)
    try { return textError("Not yet implemented: search") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
export { FoodError }
