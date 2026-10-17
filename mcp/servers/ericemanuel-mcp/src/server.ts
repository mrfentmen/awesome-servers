import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { errorMessage, searchProducts, listNewest, getProduct, priceOverview, findDeals, listCategories, catalogFacets } from "./api.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "ericemanuel-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_products",
    {
      title: "Search products",
      description: "Keyword search across the catalog.",
      inputSchema: z.object({
        query: z.string().describe("Keyword, e.g. hoodie"),
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
        return textError(String(e));
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
        return textError(String(e));
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
        return textError(String(e));
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
        return textError(String(e));
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
        return textError(String(e));
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
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "collection_catalog",
    {
      title: "Collections and their products",
      description: "Lists the store's own Shopify collections with product counts and last-published date, which is the real taxonomy here because product_type is empty on every product. Reveals that the store runs a US and an international catalog as separate collections plus curated sold-out archives, a split a flat catalog search cannot show. Optionally lists the products inside one collection, with an optional sort order.",
      inputSchema: z.object({
        collection: z.string().optional().describe("Collection handle or title, e.g. tees or sold-out-us. Omit to just list the collections."),
        limit: z.number().int().min(1).max(250).default(25).describe("Collections or products to list, default 25"),
        sort_by: z.string().default("manual").describe("Sort for collection products: manual, price-ascending, price-descending, created-descending, best-selling, created-ascending, title-ascending, title-descending"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement catalog locally (paywall removed)
    try { return textError("Not yet implemented: catalog") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "variant_matrix",
    {
      title: "Per-size variant matrix",
      description: "Shows every size of one product with its own price and stock state, plus the SKU structure. Every other tool here collapses a product to a single lowest price, which hides both the size run and the sizes already gone, and those decide whether a purchase is actually possible. Reports explicitly when every size is sold out, since a product can be in the catalog and unobtainable today.",
      inputSchema: z.object({
        handle: z.string().describe("Product handle from search_products, newest or collection_catalog."),
        include_sold_out: z.boolean().default(true).describe("Show sold-out sizes. Default true"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement matrix locally (paywall removed)
    try { return textError("Not yet implemented: matrix") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "catalog_facets",
    {
      title: "Catalog facets from tags",
      description: "Reads the store's key:value tags, which are the only working taxonomy because product_type is empty on all of its products, and reports each faceted dimension with counts for every value. Pass a facet and a value to list the products behind it, for example Material and Mesh. This is the one way to filter this catalog that actually returns anything.",
      inputSchema: z.object({
        facet: z.string().optional().describe("Faceted dimension, e.g. 'Material', 'Pattern', 'Product Type', 'Primary Color'. Omit to list all dimensions."),
        value: z.string().optional().describe("Value within the facet, e.g. 'Mesh'. Requires facet."),
        limit: z.number().int().min(1).max(200).default(30).describe("Values to list, default 30"),
        products: z.number().int().min(1).max(100).default(20).describe("Products to show when a value is selected, default 20"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await catalogFacets(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}