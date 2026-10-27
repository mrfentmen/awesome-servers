import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FoodError, format, product, search } from "./api.js";
const text = (s) => ({ content: [{ type: "text", text: s }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({ name: "open-food-facts-mcp", version: "1.0.0" });
    server.registerTool("get_product", {
        title: "Get product",
        description: "Look up a food product by barcode, ingredients, allergens, and nutrition.",
        inputSchema: z.object({ barcode: z.string().min(4) }),
        annotations: READ_ONLY,
    }, async ({ barcode }) => { try {
        return text(format(await product(barcode)));
    }
    catch (e) {
        return textError(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } });
    server.registerTool("search_products", {
        title: "Search products",
        description: "Search Open Food Facts products by text. Results are intentionally small to respect the public service.",
        inputSchema: z.object({ query: z.string().min(1), page: z.number().int().min(1).max(20).default(1) }),
        annotations: READ_ONLY,
    }, async ({ query, page }) => { try {
        return text(format(await search(query, String(page))));
    }
    catch (e) {
        return textError(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } });
    server.registerTool("ingredient_search", {
        title: "Ingredient search",
        description: "Find Open Food Facts products that list an ingredient, which the barcode and product-name searches cannot do.",
        inputSchema: z.object({ ingredient: z.string().describe("Ingredient, e.g. coconut."), limit: z.number().describe("Max products.").optional() }),
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
    server.registerTool("tag_search", {
        title: "Tag search",
        description: "Find Open Food Facts products by category, label, country, packaging or trace tag, which is how you browse a diet or a market.",
        inputSchema: z.object({ tag: z.string().describe("Tag value, e.g. chocolate."), tagType: z.string().describe("categories, labels, countries, packaging, nutriments, states, traces or ingredients.").optional(), limit: z.number().describe("Max products.").optional() }),
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
    const serverName = "open-food-facts-mcp";
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
export { FoodError };
