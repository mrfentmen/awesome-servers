import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  searchListings,
  listNewest,
  getListing,
  priceOverview,
  comparePrices,
  findDeals,
  brandOverview,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "louisvuitton-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_listings",
    {
      title: "Search listings",
      description: "Keyword search across Fashionphile and Rebag. Condition filter is Rebag-data only.",
      inputSchema: z.object({
        query: z.string().describe("Keyword, e.g. speedy, birkin, submariner."),
        limit: z.string().describe("Max results (default 10, max 25).").optional(),
        max_price: z.string().describe("Max USD price.").optional(),
        condition: z.string().describe("excellent, great, very good, good, fair (Rebag data only).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit, max_price: maxPrice, condition }) => {
      try {
        return text(await searchListings(query, limit, maxPrice, condition));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_newest",
    {
      title: "Newest listings",
      description: "Newest catalog listings, sorted by publish date.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 20, max 50).").optional(),
        page: z.string().describe("Catalog page (default 1).").optional(),
        product_type: z.string().describe("Filter, e.g. Bags, Watches, Jewelry.").optional(),
        max_price: z.string().describe("Max USD price.").optional(),
        condition: z.string().describe("excellent, great, very good, good, fair (Rebag data only).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit, page, product_type: productType, max_price: maxPrice, condition }) => {
      try {
        return text(await listNewest(limit, page, productType, maxPrice, condition));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_listing",
    {
      title: "Get listing",
      description: "Full details: variants, images, parsed condition/color/material, description.",
      inputSchema: z.object({
        handle: z.string().describe("Product handle/slug."),
        source: z.string().describe("fashionphile or rebag (tries both).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ handle, source }) => {
      try {
        return text(await getListing(handle, source));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "price_overview",
    {
      title: "Price overview",
      description: "Ask-price stats overall + by condition.",
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
    "compare_prices",
    {
      title: "Compare prices",
      description: "Group same-model listings across sources with min/max/spread.",
      inputSchema: z.object({
        query: z.string().describe("Model keyword, e.g. neverfull, daytona."),
        limit: z.string().describe("Suggest depth per source (default 30, max 60).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        return text(await comparePrices(query, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "find_deals",
    {
      title: "Find deals",
      description: "Available listings priced below the brand median.",
      inputSchema: z.object({
        limit: z.string().describe("Max deals (default 10, max 25).").optional(),
        sample: z.string().describe("Listings sampled (default 200, max 500).").optional()
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
    "brand_overview",
    {
      title: "Brand overview",
      description: "Catalog sample counts by source, type and condition.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await brandOverview());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}