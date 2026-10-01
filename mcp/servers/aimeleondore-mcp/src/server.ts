import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, searchProducts, listNewest, getProduct, priceOverview, findDeals, listCategories, listCollections, browseCollection, find_by_size, shopInfo, listPages } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "aimeleondore-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_products",
    {
      title: "Search products",
      description: "Keyword search across the catalog.",
      inputSchema: z.object({
        query: z.string().describe("Keyword, e.g. hoodie, tee, cap, sneaker."),
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
      description: "Every store collection with its handle, for browse_collection, e.g. shop-all, accessories, uniform.",
      inputSchema: z.object({
        query: z.string().describe("Filter collection titles, e.g. uniform, chains, rings, sale.").optional()
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
      description: "Listings inside one collection handle from list_collections, optionally only items in stock in a size.",
      inputSchema: z.object({
        handle: z.string().describe("Collection handle from list_collections, e.g. uniform."),
        limit: z.string().describe("Max results (default 10, max 25).").optional(),
        max_price: z.string().describe("Max USD price.").optional(),
        size: z.string().describe("Only items in stock in this size, e.g. M, 32, 7.5.").optional()
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
        size: z.string().describe("Size to match a variant, e.g. M, 32, 7.5, 18."),
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
    "shop_info",
    {
      title: "Shop info",
      description: "The Aimé Leon Dore storefront's own metadata: shop name, domain, id, headquarters and the currency it prices in.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
    // ---- paywall: shop_info ----
    const paywallMessage = await premiumRequired("shop_info")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try {
      return text(await shopInfo());
    } catch (e) {
      return textError(errorMessage(e));
    }
    }
  );

  server.registerTool(
    "list_pages",
    {
      title: "Store pages",
      description: "The informational pages the Aimé Leon Dore store publishes - About, sizing, shipping - which the product catalogue never shows.",
      inputSchema: z.object( { limit: z.number().describe("Max pages.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: list_pages ----
    const paywallMessage = await premiumRequired("list_pages")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try {
      return text(await listPages(args));
    } catch (e) {
      return textError(errorMessage(e));
    }
    }
  );

  return server
}