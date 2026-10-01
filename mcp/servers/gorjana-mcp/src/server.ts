import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { errorMessage, searchProducts, listNewest, getProduct, priceOverview, findDeals, listCategories } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "gorjana-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_products",
    {
      title: "Search products",
      description: "Keyword search across the catalog.",
      inputSchema: z.object({
        query: z.string().describe("Keyword, e.g. necklace"),
        limit: z.string().describe("Max results (default 10, max 25).").optional(),
        max_price: z.string().describe("Max USD price.").optional(),
        product_type: z.string().describe("Filter by type.").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit, max_price: maxPrice, product_type: productType }) => {
      try {
        return text(await searchProducts(query, limit, maxPrice, productType));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_newest",
    {
      title: "Newest arrivals",
      description: "Newest catalog products, sorted by publish date.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 20, max 50).").optional(),
        page: z.string().describe("Catalog page (default 1).").optional(),
        product_type: z.string().describe("Filter by type.").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit, page, product_type: productType }) => {
      try {
        return text(await listNewest(limit, page, productType));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_product",
    {
      title: "Get product",
      description: "Full details: variants with parsed options, images, description, tags.",
      inputSchema: z.object({
        handle: z.string().describe("Product handle/slug.")
      }),
      annotations: READ_ONLY,
    },
    async ({ handle }) => {
      try {
        return text(await getProduct(handle));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "price_overview",
    {
      title: "Price overview",
      description: "Ask-price distribution (min/p25/median/p75/max).",
      inputSchema: z.object({
        limit: z.string().describe("Sample size (default 200, max 500).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await priceOverview(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "find_deals",
    {
      title: "Find deals",
      description: "Available products priced below the median.",
      inputSchema: z.object({
        limit: z.string().describe("Max deals (default 10, max 25).").optional(),
        sample: z.string().describe("Products sampled (default 200, max 500).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit, sample }) => {
      try {
        return text(await findDeals(limit, sample));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_categories",
    {
      title: "Categories",
      description: "Product-type counts in the catalog sample.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listCategories());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_collections",
    {
      title: "List collections",
      description: "Every collection the Gorjana storefront publishes, most recently updated first, with product counts and handles to pass to collection_products.",
      inputSchema: z.object({
        limit: z.string().describe("Max collections (default 20, max 50).").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: list_collections ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_gorjana_list_collections", args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "collection_products",
    {
      title: "Collection products",
      description: "Products in one collection with price range, stock state and the product types in it, sorted by featured, price or newest.",
      inputSchema: z.object({
        handle: z.string().describe("Collection handle from list_collections, e.g. '14k-gold-chains'"),
        limit: z.string().describe("Max products (default 20, max 50).").optional(),
        sort: z.string().describe("featured, price_low, price_high or newest.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: collection_products ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_gorjana_collection_products", args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  return server
}