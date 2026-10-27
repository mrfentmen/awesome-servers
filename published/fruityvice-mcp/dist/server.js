import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { all, fruit } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "fruityvice-mcp", version: "1.0.0" });
    server.registerTool("fruit", {
        title: "Fruit",
        description: "Get a fruit by name.",
        inputSchema: z.object({ name: z.string().describe("Fruit name.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await fruit(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("all", {
        title: "All",
        description: "List all fruits.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await all(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("grocery_product", {
        title: "Grocery product",
        description: "Look up a packaged grocery product by barcode: name, brands, Nutri-Score, ingredients, allergens and per-100g nutrition, from the Open Food Facts database.",
        inputSchema: z.object({ barcode: z.string().describe("Product barcode, digits only, e.g. 3017620422003.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement product locally (paywall removed)
        try {
            return textError("Not yet implemented: product");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("product_search", {
        title: "Product search",
        description: "Search the Open Food Facts database for packaged food products by name, showing brand, quantity and Nutri-Score.",
        inputSchema: z.object({ query: z.string().describe("Search terms, e.g. apple juice."), limit: z.number().int().min(1).max(20).default(10).describe("Max results.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement search locally (paywall removed)
        try {
            return textError("Not yet implemented: search");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "fruityvice-mcp";
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
    server.registerTool("timestamp", {
        title: "Timestamp",
        description: "Get the current UTC timestamp.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text(new Date().toISOString());
    });
    server.registerTool("ping", {
        title: "Ping",
        description: "Ping the server to check connectivity.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("pong");
    });
    return server;
}
