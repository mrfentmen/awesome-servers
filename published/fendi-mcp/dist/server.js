import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, searchListings, listNewest, getListing, priceOverview, comparePrices, findDeals, brandOverview, listCollections, browseCollection, find_by_attribute, crossMarketMatch, priceLadder, sourceTaxonomy } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "fendi-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_listings", {
        title: "Search listings",
        description: "Keyword search across Fashionphile and Rebag. Condition filter is Rebag-data only.",
        inputSchema: z.object({
            query: z.string().describe("Keyword, e.g. Baguette, Peekaboo, Mon Tresor."),
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
            query: z.string().describe("Model keyword, e.g. Baguette, Peekaboo."),
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
    server.registerTool("cross_market_match", {
        title: "Same model priced on both resale sites",
        description: "Finds the same Fendi model on both Fashionphile and Rebag and prices them side by side, with the cheapest listing, the cheapest one actually buyable, the spread, and which site is cheaper. The two sites have different handles for the same bag, so the existing tools cannot join the catalogs at all. The join is on the model name in the title and is explicitly limited: it cannot tell a Baguette from a Baguette II and treats every colourway of a model as one comparison.",
        inputSchema: z.object({
            model: z.string().optional().describe("Model name, e.g. Baguette, Marmont, Birkin, Kelly, Peekaboo, Pochette, Speedy, Monogram, Alma."),
            query: z.string().optional().describe("Extra title words to narrow within the model, e.g. 'quilted flap'."),
            pages: z.number().int().min(1).max(4).default(2).describe("Catalog pages per site, default 2. Each site caps a page at 250 products."),
            limit: z.number().int().min(1).max(25).default(6).describe("Models to compare, default 6"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: cross_market_match ----
        try {
            return text(await crossMarketMatch(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("price_ladder", {
        title: "Price ladder and the real buyable floor",
        description: "For a model on each resale site, separates the cheapest asking price from the cheapest one that can actually be bought, since the cheapest listing on these sites is often already sold out and is therefore not a price anyone can pay. Breaks the range down by stated condition, and flags an available listing priced far below the median as a possible misprice, a defect, or a bait listing. Says that neither site publishes sold prices, so a low ask cannot be told from a high one that has not sold.",
        inputSchema: z.object({
            model: z.string().optional().describe("Model name, e.g. Baguette, Kelly, Peekaboo."),
            query: z.string().optional().describe("Extra title words to narrow within the model."),
            pages: z.number().int().min(1).max(4).default(2).describe("Catalog pages per site, default 2"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: price_ladder ----
        try {
            return text(await priceLadder(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("source_taxonomy", {
        title: "Compare the two sites' product taxonomies",
        description: "Lists the product_type values each resale site uses with counts, then shows how little the two vocabularies overlap. They are disjoint, so a category filter on one site means nothing on the other and a cross-site count by category is not like-for-like, which is why cross_market_match joins on the model name instead. Also records that neither site's tags form a usable facet tree: they are campaign and syndication markers.",
        inputSchema: z.object({
            source: z.string().optional().describe("Restrict to one site: fashionphile or rebag. Omit for both."),
            top: z.number().int().min(1).max(100).default(20).describe("Type values to list per site, default 20"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await sourceTaxonomy(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
