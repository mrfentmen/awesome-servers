import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listStores,
  listProducts,
  getProduct,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "lemonsqueezy-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_stores",
    {
      title: "List stores",
      description: "Lemon Squeezy stores on the account.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listStores());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_products",
    {
      title: "List products",
      description: "Products, optionally for one store.",
      inputSchema: z.object({
        store_id: z.string().describe("Filter by store ID.").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ store_id }) => {
      try {
        return text(await listProducts(store_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_product",
    {
      title: "Get product",
      description: "One product by id, with price and variants.",
      inputSchema: z.object({
        product_id: z.string().describe("Lemon Squeezy product ID, e.g. 123456")
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

  return server
}