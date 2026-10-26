import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { BigCommerceError, formatOrder, formatProduct, getProduct, listOrders, listProducts, listBrands, listCategories, orderDetail } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "bigcommerce-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_products", {
        title: "List products",
        description: "BigCommerce catalog products with prices, SKUs, availability.",
        inputSchema: z.object({
            keyword: z.string().default("").describe("Search keyword, empty = all"),
            limit: z.number().int().min(1).max(250).default(10),
        }),
        annotations: READ_ONLY,
    }, async ({ keyword, limit }) => {
        try {
            const rows = await listProducts(keyword, limit);
            if (rows.length === 0)
                return text("No products.");
            return text(rows.map((p, i) => formatProduct(p, i)).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_product", {
        title: "Get product",
        description: "One BigCommerce product by id.",
        inputSchema: z.object({
            id: z.string().describe("Numeric product id"),
        }),
        annotations: READ_ONLY,
    }, async ({ id }) => {
        try {
            return text(formatProduct(await getProduct(id)));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_orders", {
        title: "List orders",
        description: "Recent BigCommerce orders: status, totals, customers.",
        inputSchema: z.object({
            limit: z.number().int().min(1).max(250).default(10),
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            const rows = await listOrders(limit);
            if (rows.length === 0)
                return text("No orders.");
            return text(rows.map((o, i) => formatOrder(o, i)).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_brands", {
        title: "List brands",
        description: "BigCommerce catalog brands with page title, meta description, image flag and storefront URL.",
        inputSchema: z.object({
            limit: z.number().int().min(1).max(250).default(25),
            page: z.number().int().min(1).default(1),
            name_like: z.string().optional().describe("Filter to brands whose name contains this text"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await listBrands(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_categories", {
        title: "List categories",
        description: "BigCommerce catalog categories with parent id, active flag, storefront view count and description.",
        inputSchema: z.object({
            limit: z.number().int().min(1).max(250).default(25),
            page: z.number().int().min(1).default(1),
            parent_id: z.number().int().optional().describe("Only categories under this parent id"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await listCategories(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("order_detail", {
        title: "Order detail",
        description: "One BigCommerce order in full: money totals, billing and shipping addresses and every line item with SKU and price.",
        inputSchema: z.object({
            id: z.string().describe("Numeric order id"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await orderDetail(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "bigcommerce-mcp";
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
function errorMessage(e) {
    if (e instanceof BigCommerceError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
