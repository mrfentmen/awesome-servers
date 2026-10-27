import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchListings, listNewest, getListing, priceOverview, comparePrices, findDeals, brandOverview, variantDepth, listingFreshness, productTypeLadder } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "bottegaveneta-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_listings", {
        title: "Search listings",
        description: "Keyword search across Fashionphile and Rebag. Condition filter is Rebag-data only.",
        inputSchema: z.object({
            query: z.string().describe("Keyword, e.g. Jodie, Cassette, Pouch."),
            limit: z.string().describe("Max results (default 10, max 25).").optional(),
            max_price: z.string().describe("Max USD price.").optional(),
            condition: z.string().describe("excellent, great, very good, good, fair (Rebag data only).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit, max_price: maxPrice, condition }) => {
        try {
            return text(await searchListings(query, limit, maxPrice, condition));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_newest", {
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
    }, async ({ limit, page, product_type: productType, max_price: maxPrice, condition }) => {
        try {
            return text(await listNewest(limit, page, productType, maxPrice, condition));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_listing", {
        title: "Get listing",
        description: "Full details: variants, images, parsed condition/color/material, description.",
        inputSchema: z.object({
            handle: z.string().describe("Product handle/slug."),
            source: z.string().describe("fashionphile or rebag (tries both).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ handle, source }) => {
        try {
            return text(await getListing(handle, source));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("price_overview", {
        title: "Price overview",
        description: "Ask-price stats overall + by condition.",
        inputSchema: z.object({
            limit: z.string().describe("Sample size (default 200, max 500).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await priceOverview(limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("compare_prices", {
        title: "Compare prices",
        description: "Group same-model listings across sources with min/max/spread.",
        inputSchema: z.object({
            query: z.string().describe("Model keyword, e.g. Jodie, Cassette."),
            limit: z.string().describe("Suggest depth per source (default 30, max 60).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            return text(await comparePrices(query, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("find_deals", {
        title: "Find deals",
        description: "Available listings priced below the brand median.",
        inputSchema: z.object({
            limit: z.string().describe("Max deals (default 10, max 25).").optional(),
            sample: z.string().describe("Listings sampled (default 200, max 500).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit, sample }) => {
        try {
            return text(await findDeals(limit, sample));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("brand_overview", {
        title: "Brand overview",
        description: "Catalog sample counts by source, type and condition.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await brandOverview());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("listing_freshness", {
        title: "Listing freshness",
        description: "How fast new Bottega Veneta stock lands: newest and oldest listing dates, counts added in 30 and 90 days, listings per month and per source.",
        inputSchema: z.object({
            sample: z.string().describe("Listings sampled (default 200, max 500).").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await listingFreshness(args.sample));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("variant_depth", {
        title: "Variant depth",
        description: "Option count per listing across the brand sample: variants per item, fully-available and sold-out listings, and the price spread inside an item.",
        inputSchema: z.object({
            sample: z.string().describe("Listings sampled (default 150, max 400).").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await variantDepth(args.sample));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("product_type_ladder", {
        title: "Product type price ladder",
        description: "Stock and asking prices per product type: listing count, available share, and min, median and max price for each type.",
        inputSchema: z.object({
            sample: z.string().describe("Listings sampled (default 250, max 500).").optional(),
            min_items: z.string().describe("Only show types with at least this many listings (default 3).").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await productTypeLadder(args.sample, args.min_items));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    return server;
}
