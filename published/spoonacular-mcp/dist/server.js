import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatRecipe, getRecipe, guessNutrition, searchRecipes, SpoonacularError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "spoonacular-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_recipes", {
        title: "Search recipes",
        description: "Recipes by keyword with times and servings.",
        inputSchema: z.object({
            query: z.string().describe("Search text, e.g. 'vegan curry'"),
            limit: z.number().int().min(1).max(100).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            const rows = await searchRecipes(query, limit);
            if (rows.length === 0)
                return text(`No recipes for "${query}".`);
            return text(rows.map((r, i) => formatRecipe(r, i)).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_recipe", {
        title: "Get recipe",
        description: "One recipe: ingredients and steps.",
        inputSchema: z.object({
            id: z.string().describe("Numeric recipe id (use search_recipes)"),
        }),
        annotations: READ_ONLY,
    }, async ({ id }) => {
        try {
            return text(await getRecipe(id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("guess_nutrition", {
        title: "Guess nutrition",
        description: "Estimated calories and macros for a dish name.",
        inputSchema: z.object({
            text: z.string().describe("Dish, e.g. 'chicken tikka masala'"),
        }),
        annotations: READ_ONLY,
    }, async ({ text: dish }) => {
        try {
            return text(await guessNutrition(dish));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("product_search", {
        title: "Search packaged foods",
        description: "Search the Open Food Facts database of packaged products by name, with barcode, Nutri-Score and per-100 g nutrition.",
        inputSchema: z.object({
            query: z.string().describe("Product name or brand fragment, e.g. 'oat milk'"),
            limit: z.number().int().min(1).max(20).default(5),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            // TODO: implement search locally (paywall removed)
            try {
                return textError("Not yet implemented: search");
            }
            catch (e) {
                return textError(String(e));
            }
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("barcode_lookup", {
        title: "Look up a barcode",
        description: "One packaged product by barcode from Open Food Facts: name, brand, quantity, Nutri-Score, per-100 g nutrition, allergens and ingredients.",
        inputSchema: z.object({
            barcode: z.string().describe("8-14 digit barcode, e.g. 737628064502"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            // TODO: implement lookup locally (paywall removed)
            try {
                return textError("Not yet implemented: lookup");
            }
            catch (e) {
                return textError(String(e));
            }
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "spoonacular-mcp";
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
function errorMessage(e) {
    if (e instanceof SpoonacularError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
