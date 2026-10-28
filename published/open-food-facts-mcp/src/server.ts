import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { FoodError, format, product, search } from "./api.js"
const text = (s: string) => ({ content: [{ type: "text" as const, text: s }] })
export function createServer() { const server = new McpServer({ name: "open-food-facts-mcp", version: "1.0.0" }); server.tool("get_product", "Look up a food product by barcode, ingredients, allergens, and nutrition.", { barcode: z.string().min(4) }, async ({ barcode }) => { try { return text(format(await product(barcode))) } catch (e) { return text(`Error: ${e instanceof Error ? e.message : String(e)}`) } }); server.tool("search_products", "Search Open Food Facts products by text. Results are intentionally small to respect the public service.", { query: z.string().min(1), page: z.number().int().min(1).max(20).default(1) }, async ({ query, page }) => { try { return text(format(await search(query, String(page)))) } catch (e) { return text(`Error: ${e instanceof Error ? e.message : String(e)}`) } }); return server }
export { FoodError }
