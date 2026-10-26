import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchProducts, listNewest, getProduct, priceOverview, findDeals, listCategories } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "jacquesmariemage-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_products", {
        title: "Search products",
        description: "Keyword search across the catalog.",
        inputSchema: z.object({
            query: z.string().describe("Keyword, e.g. watch"),
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
            return textError(String(e));
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
            return textError(String(e));
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
            return textError(String(e));
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
            return textError(String(e));
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
            return textError(String(e));
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
            return textError(String(e));
        }
    });
    server.registerTool("lens_matrix", {
        title: "Lens matrix",
        description: "Which lens types the catalogue actually sells (CR39, polarized, prescription and so on) with the variant count, product count and median price, plus the full colourway count and price spread.",
        inputSchema: z.object({ sample: z.string().describe("How many products to sample (default 300, max 1500).").optional(), limit: z.string().describe("How many lens types to print (default 12, max 30).").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement matrix locally (paywall removed)
        try {
            return textError("Not yet implemented: matrix");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("model_families", {
        title: "Model families",
        description: "Which frame families the house is currently publishing, counted from the live catalogue: colourways per family, example handles, starting price and the newest listing date.",
        inputSchema: z.object({ sample: z.string().describe("How many products to sample (default 300, max 1500).").optional(), limit: z.string().describe("How many families to print (default 15, max 40).").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement families locally (paywall removed)
        try {
            return textError("Not yet implemented: families");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "jacquesmariemage-mcp";
    server.registerTool("health_check", {
        title: "Health check",
        description: "Check if the server is running and responsive.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("OK - server is running");
    });
    server.registerTool("version_info", {
        title: "Version info",
        description: "Get server version and metadata.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text(JSON.stringify({ name: serverName, version: "1.0.0" }, null, 2));
    });
    return server;
}
