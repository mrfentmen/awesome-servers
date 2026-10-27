import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { allProducts, productCycles, productSearch } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "endoflife-mcp", version: "1.0.0" });
    server.registerTool("product_cycles", {
        title: "Product cycles",
        description: "Release and EOL dates for a product.",
        inputSchema: z.object({ product: z.string().describe("Product name like nodejs or python.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await productCycles(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("all_products", {
        title: "All products",
        description: "List all tracked products.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await allProducts(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("product_profile", {
        title: "Product profile",
        description: "Full endoflife.date profile for one product: aliases, version command, links, and every release cycle with its support dates and latest patch.",
        inputSchema: z.object({ product: z.string().describe("Product name like nodejs or ubuntu."), cycles: z.number().describe("How many release cycles to list, 1-100. Defaults to 15.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement profile locally (paywall removed)
        try {
            return textError("Not yet implemented: profile");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("cycle_support", {
        title: "Cycle support",
        description: "Exact support timeline for one release cycle: release date, LTS date, each support stage's end date, and days remaining or elapsed.",
        inputSchema: z.object({ product: z.string().describe("Product name like nodejs or ubuntu."), cycle: z.string().describe("Release cycle like 20 or 24.04.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement support locally (paywall removed)
        try {
            return textError("Not yet implemented: support");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("product_search", {
        title: "Product search",
        description: "Find products endoflife.date tracks by name, alias, tag or category, or list the categories it covers.",
        inputSchema: z.object({ query: z.string().describe("Text to look for in the product name, label, alias or tag.").optional(), category: z.string().describe("Only products in this category, like os or lang.").optional(), tag: z.string().describe("Only products carrying this exact tag.").optional(), limit: z.number().describe("How many products to list, 1-100.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await productSearch(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "endoflife-mcp";
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
    return server;
}
