import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchItems, getItem, getItemGroup, getLegacyItem, dealItems, searchExtended, searchEndingSoon, searchLowestPrice, searchNewlyListed, searchByCategory, shippingOptions, findItemGroup, marketPriceContext } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "ebay-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_items", {
        title: "Search items",
        description: "eBay listings matching a query, with price and condition.",
        inputSchema: z.object({
            query: z.string().describe("Search text."),
            limit: z.string().describe("Max results (default 10, max 200).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            return text(await searchItems(query, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_item", {
        title: "Get item",
        description: "One listing by item id, with price and seller.",
        inputSchema: z.object({
            item_id: z.string().describe("eBay item ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ item_id }) => {
        try {
            return text(await getItem(item_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_item_group", {
        title: "Item group",
        description: "Multi-seller listing group.",
        inputSchema: z.object({
            item_group_id: z.string().describe("Group ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ item_group_id }) => {
        try {
            return text(await getItemGroup(item_group_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_legacy_item", {
        title: "Legacy item",
        description: "Lookup by legacy ID.",
        inputSchema: z.object({
            legacy_id: z.string().describe("Legacy numeric ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ legacy_id }) => {
        try {
            return text(await getLegacyItem(legacy_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("deal_items", {
        title: "Deal items",
        description: "eBay Top Deals.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 10, max 200).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await dealItems(limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_extended", {
        title: "Extended search",
        description: "Search with full item details.",
        inputSchema: z.object({
            query: z.string().describe("Search text."),
            limit: z.string().describe("Max results (default 10, max 200).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            return text(await searchExtended(query, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_ending_soon", {
        title: "Ending soon",
        description: "Auctions ending first.",
        inputSchema: z.object({
            query: z.string().describe("Search text."),
            limit: z.string().describe("Max results (default 10, max 200).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            return text(await searchEndingSoon(query, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_lowest_price", {
        title: "Lowest price",
        description: "Cheapest first.",
        inputSchema: z.object({
            query: z.string().describe("Search text."),
            limit: z.string().describe("Max results (default 10, max 200).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            return text(await searchLowestPrice(query, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_newly_listed", {
        title: "Newly listed",
        description: "Newest first.",
        inputSchema: z.object({
            query: z.string().describe("Search text."),
            limit: z.string().describe("Max results (default 10, max 200).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            return text(await searchNewlyListed(query, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_by_category", {
        title: "Search in category",
        description: "Scoped search.",
        inputSchema: z.object({
            query: z.string().describe("Search text."),
            category_id: z.string().describe("Category ID."),
            limit: z.string().describe("Max results (default 10, max 200).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, category_id, limit }) => {
        try {
            return text(await searchByCategory(query, category_id, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("shipping_options", {
        title: "Shipping options and landed cost",
        description: "Renders the full shipping table for one eBay listing: cost per service, delivery window, handling time, free-shipping flag, and import charges, then computes the landed cost, which is the item price plus shipping. A listing that is cheapest on the sticker price is often not the cheapest to buy once shipping is added, and no other tool here totals it.",
        inputSchema: z.object({
            item_id: z.string().describe("eBay item id, for example v1|123456789012|0 or a numeric legacy id."),
            item_price: z.string().optional().describe("Item price, to include in the landed cost. Defaults to the listing price."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await shippingOptions(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("find_item_group", {
        title: "Find related listings in the same item group",
        description: "Given one or more eBay item ids, finds which listings eBay groups as the same product and then lists the whole group priced side by side, flagging when the id you searched for is above the cheapest listing in its own group. This is how you find a cheaper copy of something you have already found. Groups are eBay's own product matching and are sometimes incomplete.",
        inputSchema: z.object({
            item_ids: z.string().describe("eBay item ids, comma separated, up to 20."),
            with_listings: z.boolean().default(true).describe("Also list and price every listing in each group. Default true"),
            limit: z.number().int().min(1).max(200).default(30).describe("Listings per group, default 30"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await findItemGroup(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("market_price_context", {
        title: "Price context for a search",
        description: "Runs an eBay search and reports the price distribution rather than raw results: lowest, median and highest, how many listings sit at or below the median, the cheapest landed price once shipping is added, and how concentrated the listings are in one seller. Answers whether a price is a deal or just the going rate. Uses asking prices on active US listings, not sold history.",
        inputSchema: z.object({
            query: z.string().describe("Search query, for example a product noun phrase."),
            limit: z.number().int().min(2).max(200).default(50).describe("Listings to consider, default 50"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await marketPriceContext(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    return server;
}
