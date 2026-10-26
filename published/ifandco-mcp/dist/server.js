import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, searchProducts, listNewest, getProduct, priceOverview, findDeals, listCategories, listCollections, collectionProducts, restockCheck, materialCensus, personalisationCensus } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "ifandco-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_products", {
        title: "Search products",
        description: "Keyword search across the catalog.",
        inputSchema: z.object({
            query: z.string().describe("Keyword, e.g. pendant, tennis chain, ring."),
            limit: z.string().describe("Max results (default 10, max 25).").optional(),
            max_price: z.string().describe("Max USD price.").optional(),
            product_type: z.string().describe("Filter by type.").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit, max_price: maxPrice, product_type: productType }) => {
        try {
            return text(await searchProducts(query, limit, maxPrice, productType));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_newest", {
        title: "Newest arrivals",
        description: "Newest catalog products, sorted by publish date.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 20, max 50).").optional(),
            page: z.string().describe("Catalog page (default 1).").optional(),
            product_type: z.string().describe("Filter by type.").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit, page, product_type: productType }) => {
        try {
            return text(await listNewest(limit, page, productType));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_product", {
        title: "Get product",
        description: "Full details: variants with parsed options, images, description, tags.",
        inputSchema: z.object({
            handle: z.string().describe("Product handle/slug.")
        }),
        annotations: READ_ONLY,
    }, async ({ handle }) => {
        try {
            return text(await getProduct(handle));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("price_overview", {
        title: "Price overview",
        description: "Ask-price distribution (min/p25/median/p75/max).",
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
    server.registerTool("find_deals", {
        title: "Find deals",
        description: "Available products priced below the median.",
        inputSchema: z.object({
            limit: z.string().describe("Max deals (default 10, max 25).").optional(),
            sample: z.string().describe("Products sampled (default 200, max 500).").optional()
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
    server.registerTool("list_categories", {
        title: "Categories",
        description: "Product-type counts in the catalog sample.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listCategories());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_collections", {
        title: "List collections",
        description: "Collections with handle, product count and URL, longest first.",
        inputSchema: z.object({
            limit: z.string().describe("Max collections (default 40, max 250).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await listCollections(limit));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("collection_products", {
        title: "Collection products",
        description: "Every product in one collection with live price and stock, sortable.",
        inputSchema: z.object({
            handle: z.string().describe("Collection handle from list_collections, e.g. balms."),
            limit: z.string().describe("Max results (default 20, max 50).").optional(),
            sort: z.string().describe("featured, price_low, price_high or newest.").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ handle, limit, sort }) => {
        try {
            return text(await collectionProducts(handle, limit, sort));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("restock_check", {
        title: "Restock check",
        description: "Stock and price for specific product handles: what is buyable right now and which options are left.",
        inputSchema: z.object({
            handles: z.string().describe("Up to 10 product handles, comma separated.")
        }),
        annotations: READ_ONLY,
    }, async ({ handles }) => {
        try {
            return text(await restockCheck(handles));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("material_census", {
        title: "Material census",
        description: "What the catalogue is actually made of: how many listings mention each metal or stone, the share of the sample, and the median price of the variants that carry it. Counted from real titles, tags and descriptions.",
        inputSchema: z.object({ sample: z.string().describe("How many products to sample (default 400, max 2000).").optional(), limit: z.string().describe("How many materials to print (default 16, max 30).").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: material_census ----
        try {
            return text(await materialCensus(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("personalisation_census", {
        title: "Personalisation census",
        description: "The personalisation the catalogue offers - engraving, initials, birthstones, made-to-order sizing, gift packaging, stackability, hypoallergenic, waterproof - with the share of listings that mention each.",
        inputSchema: z.object({ sample: z.string().describe("How many products to sample (default 400, max 2000).").optional(), limit: z.string().describe("How many personalisation types to print (default 10, max 20).").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: personalisation_census ----
        try {
            return text(await personalisationCensus(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
