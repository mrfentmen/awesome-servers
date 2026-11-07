import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { getProduct } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "endoflife-date-mcp", version: "1.0.0" })

  server.tool(
    "get_product",
    "Release cycles and end of life dates",
    { product: z.string().min(1).describe("Product, e.g. nodejs") },
    async ({ product }) => {
      try {
        return text(await getProduct(product))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
