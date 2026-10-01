import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { errorMessage, searchListings, listNewest, getListing, priceOverview, comparePrices, findDeals, brandOverview, lineFamilyMix } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "cartier-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_listings",
    {
      title: "Search listings",
      description: "Keyword search across Fashionphile and Rebag. Condition filter is Rebag-data only.",
      inputSchema: z.object({
        query: z.string().describe("Keyword, e.g. Love bracelet, Tank, Santos."),
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
        query: z.string().describe("Model keyword, e.g. Love, Tank."),
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

  server.registerTool(
    "list_store_collections",
    {
      title: "Store collections",
      description: "Curated collections on both resale stores, with each collection's full size on that store. Handles feed collection_cartier_items.",
      inputSchema: z.object({
        query: z.string().optional().describe("Only collections whose title contains this text"),
        limit: z.string().describe("Max collections (default 30, max 60).").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: list_store_collections ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_cartier_list_store_collections", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "collection_cartier_items",
    {
      title: "Collection Cartier items",
      description: "Every Cartier listing inside one store collection, looked up on both stores at once, with optional price ceiling and condition filter.",
      inputSchema: z.object({
        handle: z.string().describe("Collection handle from list_store_collections"),
        source: z.string().optional().describe("fashionphile or rebag, omit for both"),
        limit: z.string().describe("Max listings (default 20, max 50).").optional(),
        max_price: z.string().describe("Max USD price.").optional(),
        condition: z.string().optional().describe("excellent, great, very good, good or fair").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: collection_cartier_items ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_cartier_collection_cartier_items", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "line_family_mix",
    {
      title: "Product line mix",
      description: "Which Cartier product line the sample is mostly made of - Love, Tank, Santos, Ballon Bleu and the rest - with availability and price band per line, grouped by title keyword.",
      inputSchema: z.object({
        sample: z.string().describe("Listings sampled (default 150, max 400).").optional(),
        min_items: z.string().describe("Only show lines with at least this many listings (default 1).").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await lineFamilyMix(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}