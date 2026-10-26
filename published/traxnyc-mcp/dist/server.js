import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, searchProducts, listNewest, getProduct, priceOverview, findDeals, listCategories, listCollections, browseCollection, find_by_size, priceDistribution, sizeMatrix, catalogueHealth } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "traxnyc-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_products", {
        title: "Search products",
        description: "Keyword search across the catalog.",
        inputSchema: z.object({
            query: z.string().describe("Keyword, e.g. cuban link, pendant, watch."),
            limit: z.string().describe("Max results (default 10, max 25).").optional(),
            max_price: z.string().describe("Max USD price.").optional(),
            product_type: z.string().describe("Filter, e.g. Watch, Ring, Chain.").optional()
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
            handle: z.string().describe("Product handle/slug, e.g. a handle returned by search_products.")
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
            limit: z.string().describe("Sample size (default 200, max 500), e.g. 400 for a tighter median.").optional()
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
            limit: z.string().describe("Max deals (default 10, max 25), e.g. 25 for the deepest discounts.").optional(),
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
        description: "Product-type counts in the catalog sample, e.g. how many chains, pendants and rings are listed.",
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
        description: "Curated store collections with handles for browse_collection, e.g. sale or category collections.",
        inputSchema: z.object({
            query: z.string().describe("Filter collection titles, e.g. sale, sneakers, rings.").optional()
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
        description: "Listings inside one collection handle from list_collections, optionally only in-stock sizes.",
        inputSchema: z.object({
            handle: z.string().describe("Collection handle from list_collections."),
            limit: z.string().describe("Max results (default 10, max 25).").optional(),
            max_price: z.string().describe("Max USD price.").optional(),
            size: z.string().describe("Only items in stock in this size, e.g. 10.5 or M.").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ handle, limit, max_price: maxPrice, size }) => {
        try {
            return text(await browseCollection(handle, limit, maxPrice, size));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("find_by_size", {
        title: "Find by size",
        description: "In-stock items in a size, with that size's price and the other sizes still in stock.",
        inputSchema: z.object({
            size: z.string().describe("Size to match a variant, e.g. 10.5, M, 7, White / 5."),
            limit: z.string().describe("Max results (default 10, max 25).").optional(),
            max_price: z.string().describe("Max USD price.").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ size, limit, max_price: maxPrice }) => {
        try {
            return text(await find_by_size(size, limit, maxPrice));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("size_matrix", {
        title: "Size matrix",
        description: "The whole size curve of the catalogue rather than one filter: every size value with how many variants carry it and how many are in stock, grouped into numeric ring sizing and inch lengths, with sizes missing entirely from the range called out and any size left with nothing buyable flagged, plus a count of products that offer no size choice at all.",
        inputSchema: z.object({
            pages: z.number().describe("Catalogue pages of 250 products to read, 1-3.").optional(),
            threshold: z.number().describe("Only count sizes with at least this many in-stock variants, 0-50.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await sizeMatrix(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("price_distribution", {
        title: "Price distribution",
        description: "Where the money sits in the catalogue: the price range, the 25th, median and 75th percentiles against the mean, a histogram in equal-width buckets, the share of variants under each of seven round thresholds, and per product type the variant count with minimum, median and maximum, with a note on why a per-variant count flatters the types with more sizes.",
        inputSchema: z.object({
            pages: z.number().describe("Catalogue pages of 250 products to read, 1-3.").optional(),
            buckets: z.number().describe("Histogram buckets, 3-12.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await priceDistribution(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("catalogue_health", {
        title: "Catalogue health",
        description: "What is wrong with the catalogue data itself, which is what quietly breaks a storefront: products with no product_type, no tags, no image or no usable price, single-variant products with no size choice, products where every variant is unavailable, how many variants carry a compare-at price and how many are markdowns deeper than thirty per cent, and the tag distribution including how many tags are used exactly once.",
        inputSchema: z.object({ pages: z.number().describe("Catalogue pages of 250 products to read, 1-3.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await catalogueHealth(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
