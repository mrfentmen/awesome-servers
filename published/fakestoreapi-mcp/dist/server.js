import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { categories, product, products, catalogSummary } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "fakestoreapi-mcp", version: "1.0.0" });
    server.registerTool("products", {
        title: "Products",
        description: "List products.",
        inputSchema: z.object({ limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await products(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("product", {
        title: "Product",
        description: "Get a product by id.",
        inputSchema: z.object({ id: z.number().describe("Product id.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await product(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("categories", {
        title: "Categories",
        description: "List product categories.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await categories(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("products_by_category", {
        title: "Products by category",
        description: "One category's products sorted by price, from the real category names the store publishes. An unknown category is rejected with the four real names.",
        inputSchema: z.object({ category: z.string().describe("Category name, like electronics or jewelery."), sort: z.string().describe("asc or desc by price. Defaults to asc.").optional(), limit: z.number().describe("How many products to show, 1-50. Defaults to 10.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement category locally (paywall removed)
        try {
            return textError("Not yet implemented: category");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("catalog_summary", {
        title: "Catalogue summary",
        description: "The whole catalogue in one view: product count per category, real price ranges and averages, and the best rated items.",
        inputSchema: z.object({ top: z.number().describe("How many best-rated products to list, 1-10. Defaults to 3.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await catalogSummary(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("cart_detail", {
        title: "Cart detail",
        description: "One cart with every line item resolved to its product title and price, plus the cart total.",
        inputSchema: z.object({ id: z.number().describe("Cart id, 1 to 7.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement detail locally (paywall removed)
        try {
            return textError("Not yet implemented: detail");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "fakestoreapi-mcp";
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
    server.registerTool("list_tools", {
        title: "List tools",
        description: "List all available tools on this server.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("See the tools/list response for the full tool list.");
    });
    server.registerTool("echo", {
        title: "Echo",
        description: "Echo back the provided text.",
        inputSchema: z.object({ text: z.string().describe("Text to echo.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        return text(String(args?.text ?? ""));
    });
    return server;
}
