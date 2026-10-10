import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, searchListings, listNewest, getListing, priceOverview, comparePrices, findDeals, brandOverview, listCollections, browseCollection, find_by_attribute, inventoryDigest } from "./api.js";
import { premiumTool } from "./gateway.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "dior-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_listings", {
        title: "Search listings",
        description: "Keyword search across Fashionphile and Rebag. Condition filter is Rebag-data only.",
        inputSchema: z.object({
            query: z.string().describe("Keyword, e.g. Lady Dior, Saddle, Book Tote."),
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
            return textError(errorMessage(e));
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
            return textError(errorMessage(e));
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
            return textError(errorMessage(e));
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
            return textError(errorMessage(e));
        }
    });
    server.registerTool("compare_prices", {
        title: "Compare prices",
        description: "Group same-model listings across sources with min/max/spread.",
        inputSchema: z.object({
            query: z.string().describe("Model keyword, e.g. Lady Dior, Saddle."),
            limit: z.string().describe("Suggest depth per source (default 30, max 60).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            return text(await comparePrices(query, limit));
        }
        catch (e) {
            return textError(errorMessage(e));
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
            return textError(errorMessage(e));
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
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_collections", {
        title: "List collections",
        description: "Curated store collections with handles for browse_collection, e.g. sale or category collections.",
        inputSchema: z.object({
            query: z.string().describe("Filter collection titles, e.g. sale, bags, watches.").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query }) => {
        try {
            return text(await listCollections(query));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("browse_collection", {
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
    }, async ({ handle, source, limit, max_price: maxPrice, condition }) => {
        try {
            return text(await browseCollection(handle, source, limit, maxPrice, condition));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("find_by_attribute", {
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
    }, async ({ color, material, condition, max_price: maxPrice, limit, sample }) => {
        try {
            return text(await find_by_attribute(color, material, condition, maxPrice, limit, sample));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("line_catalogue", {
        title: "Dior line catalogue",
        description: "The Dior product lines actually in stock across Fashionphile and Rebag, with item counts, price range and median per line, condition mix where a site publishes it, and which source each line came from. Lines are matched from listing titles most-specific-first, so a title naming both a hardware style and a bag shape is credited once, and listings naming no known line are counted separately rather than dropped.",
        inputSchema: z.object({
            sample: z.number().int().min(40).max(500).default(300).describe("Listings to sample, 40-500, default 300"),
            min_items: z.number().int().min(1).max(20).default(1).describe("Only show lines with at least this many listings, default 1"),
            limit: z.number().int().min(1).max(40).default(15).describe("Lines to show, default 15"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: line_catalogue ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_dior_line_catalogue", args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("source_coverage", {
        title: "Resale source coverage",
        description: "What Fashionphile and Rebag each actually publish for Dior: listing counts, availability, price range, how many listings carry colour, material and condition tags, whether size appears in variant titles, and each site's full product_type vocabulary. Reveals that a colour, material or condition filter only works on whichever site publishes those tags, and that the two category vocabularies do not align.",
        inputSchema: z.object({
            sample: z.number().int().min(40).max(400).default(200).describe("Catalogue pages per site to scan, default 3"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: source_coverage ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_dior_source_coverage", args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("inventory_digest", {
        title: "Inventory digest",
        description: "The combined Dior inventory right now: listing counts per source, how much is actually sellable against sold, the price range and median, how much sits below $500 and at or above $3,000, the published-date range, and the most recently published listings. Counts by product type are shown as each site labels them.",
        inputSchema: z.object({
            sample: z.number().int().min(40).max(500).default(250).describe("Listings to sample, 40-500, default 250"),
            limit: z.number().int().min(1).max(30).default(10).describe("Recent listings to show, default 10"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await inventoryDigest(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
