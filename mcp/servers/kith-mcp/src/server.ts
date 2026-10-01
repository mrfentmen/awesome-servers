import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { errorMessage, searchProducts, listNewest, getProduct, priceOverview, findDeals, listCategories, listCollections, browseCollection, find_by_size } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "kith-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_products",
    {
      title: "Search products",
      description: "Keyword search across the catalog.",
      inputSchema: z.object({
        query: z.string().describe("Keyword, e.g. hoodie, tee, jacket, sneaker."),
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
      description: "Curated store collections with handles for browse_collection, e.g. sale or category collections.",
      inputSchema: z.object({
        query: z.string().describe("Filter collection titles, e.g. sale, sneakers, rings.").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query }) => {
      try {
        return text(await listCollections(query));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "browse_collection",
    {
      title: "Browse collection",
      description: "Listings inside one collection handle from list_collections, optionally only in-stock sizes.",
      inputSchema: z.object({
        handle: z.string().describe("Collection handle from list_collections."),
        limit: z.string().describe("Max results (default 10, max 25).").optional(),
        max_price: z.string().describe("Max USD price.").optional(),
        size: z.string().describe("Only items in stock in this size, e.g. 10.5 or M.").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ handle, limit, max_price: maxPrice, size }) => {
      try {
        return text(await browseCollection(handle, limit, maxPrice, size));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "find_by_size",
    {
      title: "Find by size",
      description: "In-stock items in a size, with that size's price and the other sizes still in stock.",
      inputSchema: z.object({
        size: z.string().describe("Size to match a variant, e.g. 10.5, M, 7, White / 5."),
        limit: z.string().describe("Max results (default 10, max 25).").optional(),
        max_price: z.string().describe("Max USD price.").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ size, limit, max_price: maxPrice }) => {
      try {
        return text(await find_by_size(size, limit, maxPrice));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "size_run_matrix",
    {
      title: "Size run matrix",
      description: "For every option axis the store sells on: how many size variants exist, how many are actually buyable now, the coverage percentage and the median in-stock price. The product tools only ever print the first variant.",
      inputSchema: z.object({ sample: z.string().describe("How many products to sample (default 300, max 1500).").optional(), limit: z.string().describe("How many values or axes to print (default 12, max 40).").optional(), axis: z.string().describe("Axis name filter, e.g. 'Size'. All axes by default.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: size_run_matrix ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_kith_size_run_matrix", args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "collaboration_census",
    {
      title: "Collaboration census",
      description: "Which collaborations the shop is actually carrying, counted from the live catalog titles: product count, size variants, starting price and an example title for each partner.",
      inputSchema: z.object({ sample: z.string().describe("How many products to sample (default 300, max 1500).").optional(), limit: z.string().describe("How many partners to print (default 15, max 40).").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: collaboration_census ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_kith_collaboration_census", args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  return server
}