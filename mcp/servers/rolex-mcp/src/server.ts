import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { errorMessage, searchListings, listNewest, getListing, priceOverview, comparePrices, findDeals, brandOverview, listCollections, browseCollection, find_by_attribute } from "./api.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "rolex-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_listings",
    {
      title: "Search listings",
      description: "Keyword search across Fashionphile and Rebag. Condition filter is Rebag-data only.",
      inputSchema: z.object({
        query: z.string().describe("Keyword, e.g. Submariner, Datejust, Daytona."),
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
        return textError(String(e));
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
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "get_listing",
    {
      title: "Get listing",
      description: "Full details: variants, images, parsed condition/color/material, description.",
      inputSchema: z.object({
        handle: z.string().describe("Product handle/slug, e.g. a handle returned by search_listings."),
        source: z.string().describe("fashionphile or rebag (tries both).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ handle, source }) => {
      try {
        return text(await getListing(handle, source));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "price_overview",
    {
      title: "Price overview",
      description: "Ask-price stats overall + by condition.",
      inputSchema: z.object({
        limit: z.string().describe("Sample size (default 200, max 500), e.g. 400 for a tighter median.").optional()
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
    "compare_prices",
    {
      title: "Compare prices",
      description: "Group same-model listings across sources with min/max/spread.",
      inputSchema: z.object({
        query: z.string().describe("Model keyword, e.g. Submariner, Daytona."),
        limit: z.string().describe("Suggest depth per source (default 30, max 60).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        return text(await comparePrices(query, limit));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "find_deals",
    {
      title: "Find deals",
      description: "Available listings priced below the brand median.",
      inputSchema: z.object({
        limit: z.string().describe("Max deals (default 10, max 25), e.g. 25 for the deepest discounts.").optional(),
        sample: z.string().describe("Listings sampled (default 200, max 500), e.g. 400 to sample more listings.").optional()
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
    "brand_overview",
    {
      title: "Brand overview",
      description: "Catalog sample counts by source, type and condition, e.g. how many Bags, Watches and Jewelry are listed.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await brandOverview());
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "list_collections",
    {
      title: "List collections",
      description: "Curated store collections with handles for browse_collection, e.g. sale or category collections.",
      inputSchema: z.object({
        query: z.string().describe("Filter collection titles, e.g. sale, bags, watches.").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query }) => {
      try {
        return text(await listCollections(query));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "browse_collection",
    {
      title: "Browse collection",
      description: "Listings inside one collection handle from list_collections, e.g. a sale or category collection.",
      inputSchema: z.object({
        handle: z.string().describe("Collection handle from list_collections, e.g. discounted-10-off."),
        source: z.string().describe("fashionphile or rebag (default: both).").optional(),
        limit: z.string().describe("Max results (default 10, max 25).").optional(),
        max_price: z.string().describe("Max USD price.").optional(),
        condition: z.string().describe("excellent, great, very good, good, fair (Rebag data only).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ handle, source, limit, max_price: maxPrice, condition }) => {
      try {
        return text(await browseCollection(handle, source, limit, maxPrice, condition));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "find_by_attribute",
    {
      title: "Find by attribute",
      description: "Listings filtered by color, exterior material or condition, plus the common values in the sample.",
      inputSchema: z.object({
        color: z.string().describe("Color keyword, e.g. black, gold, blue.").optional(),
        material: z.string().describe("Exterior material, e.g. leather, canvas, exotic.").optional(),
        condition: z.string().describe("excellent, great, very good, good, fair.").optional(),
        max_price: z.string().describe("Max USD price.").optional(),
        limit: z.string().describe("Max results (default 10, max 25).").optional(),
        sample: z.string().describe("Listings sampled (default 200, max 500).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ color, material, condition, max_price: maxPrice, limit, sample }) => {
      try {
        return text(await find_by_attribute(color, material, condition, maxPrice, limit, sample));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "watch_spec_matrix",
    {
      title: "Watch specification matrix",
      description:
        "The Rolex range as a watch rather than a price list: grouped by case material and case diameter, with the model line, asking range and median for each cell, read from the listing titles.",
      inputSchema: z.object({
        limit: z.string().describe("Max cells listed, 1-40. Defaults to 15.").optional(),
        line: z.string().describe("Restrict to a model line, e.g. 'Datejust' or 'Submariner'.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement matrix locally (paywall removed)
    try { return textError("Not yet implemented: matrix") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "reference_lookup",
    {
      title: "Reference number lookup",
      description:
        "The reference number behind a listing, with its model line, case diameter and case material, and every other listing in the current results carrying the same reference.",
      inputSchema: z.object({
        handle: z.string().describe("Listing handle, the last segment of the product URL"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement lookup locally (paywall removed)
    try { return textError("Not yet implemented: lookup") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}