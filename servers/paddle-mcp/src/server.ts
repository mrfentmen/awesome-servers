import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listProducts,
  getProduct,
  listPrices,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "paddle-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_products",
    {
      title: "List products",
      description: "Paddle products with price and status.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listProducts());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_product",
    {
      title: "Get product",
      description: "One Paddle product by id, with price and status.",
      inputSchema: z.object({
        product_id: z.string().describe("Product ID (pro_...).")
      }),
      annotations: READ_ONLY,
    },
    async ({ product_id }) => {
      try {
        return text(await getProduct(product_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_prices",
    {
      title: "List prices",
      description: "Prices, optionally for one product.",
      inputSchema: z.object({
        product_id: z.string().describe("Filter by product ID.").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ product_id }) => {
      try {
        return text(await listPrices(product_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}