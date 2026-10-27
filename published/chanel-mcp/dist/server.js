import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchListings, listNewest, getListing, priceOverview, comparePrices, findDeals, brandOverview, listCollections, browseCollection, find_by_attribute, crossStoreArbitrage, lineFamilyMix, conditionTypeGrid } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "chanel-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_listings", {
        title: "Search listings",
        description: "Keyword search across Fashionphile and Rebag. Condition filter is Rebag-data only.",
        inputSchema: z.object({
            query: z.string().describe("Keyword, e.g. Classic Flap, Boy, WOC."),
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
            query: z.string().describe("Model keyword, e.g. Classic Flap, Boy."),
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
            return textError(String(e));
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
            return textError(String(e));
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
            return textError(String(e));
        }
    });
    server.registerTool("line_family_mix", {
        title: "Line family mix",
        description: "Which Chanel line the sample is mostly made of - Classic Flap, Boy, 2.55, Gabrielle, J12, Nautilus and the rest - with availability and price band per line, grouped by title keyword.",
        inputSchema: z.object({
            sample: z.string().describe("Listings sampled (default 150, max 400).").optional(),
            min_items: z.string().describe("Only show lines with at least this many listings (default 1).").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await lineFamilyMix(args.sample, args.min_items));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("condition_type_grid", {
        title: "Condition by type price grid",
        description: "Median asking price where product type meets condition, as a grid with sample counts per cell, so gaps in the inventory show up.",
        inputSchema: z.object({
            sample: z.string().describe("Listings sampled (default 200, max 500).").optional(),
            min_cells: z.string().describe("Only show product types with at least this many listings (default 1).").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await conditionTypeGrid(args.sample, args.min_cells));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("cross_store_arbitrage", {
        title: "Cross-store arbitrage",
        description: "Chanel models listed on both resale stores at the same time, with the price gap, which store is cheaper, the condition there and every offer with its link.",
        inputSchema: z.object({
            sample: z.string().describe("Listings sampled (default 250, max 500).").optional(),
            min_gap_pct: z.string().describe("Only report gaps at or above this percentage (default 10).").optional(),
            limit: z.string().describe("Max models to report (default 12, max 25).").optional(),
            title_words: z.number().int().min(2).max(8).default(5).describe("Group models by the first N significant title words, default 5")
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await crossStoreArbitrage(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    return server;
}
