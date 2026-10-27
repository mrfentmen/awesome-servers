import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { hot, iced, search, drinksWithIngredient } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "coffee-mcp", version: "1.0.0" });
    server.registerTool("hot", {
        title: "Hot",
        description: "Hot coffee drinks.",
        inputSchema: z.object({ limit: z.number().describe("Maximum results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await hot(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("iced", {
        title: "Iced",
        description: "Iced coffee drinks.",
        inputSchema: z.object({ limit: z.number().describe("Maximum results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await iced(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search", {
        title: "Search",
        description: "Search drinks by keyword.",
        inputSchema: z.object({ query: z.string().describe("Keyword."), limit: z.number().describe("Maximum results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await search(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("drink_detail", {
        title: "Drink detail",
        description: "One coffee drink by name with its full untruncated description, ingredients and image.",
        inputSchema: z.object({ name: z.string().describe("Drink name, e.g. Cortado.") }),
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
    server.registerTool("drinks_with_ingredient", {
        title: "Drinks with ingredient",
        description: "Every coffee drink in the catalogue that lists an ingredient, hot and iced.",
        inputSchema: z.object({ ingredient: z.string().describe("Ingredient, e.g. Espresso."), limit: z.number().describe("Max drinks.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await drinksWithIngredient(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("ingredient_index", {
        title: "Ingredient index",
        description: "Every distinct ingredient across the whole catalogue with the number of drinks using it.",
        inputSchema: z.object({ limit: z.number().describe("Max ingredients.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement index locally (paywall removed)
        try {
            return textError("Not yet implemented: index");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "coffee-mcp";
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
