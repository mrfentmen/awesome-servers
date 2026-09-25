import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, searchCocktails, getCocktail, randomCocktail, listIngredients, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "cocktaildb-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_cocktails", {
        title: "Search cocktails",
        description: "Search by name.",
        inputSchema: z.object({
            query: z.string().describe("Cocktail name, e.g. margarita.")
        }),
        annotations: READ_ONLY,
    }, async ({ query }) => {
        try {
            return text(await searchCocktails(query));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_cocktail", {
        title: "Get cocktail",
        description: "Full recipe by drink ID.",
        inputSchema: z.object({
            drink_id: z.string().describe("Drink ID, e.g. 11007.")
        }),
        annotations: READ_ONLY,
    }, async ({ drink_id }) => {
        try {
            return text(await getCocktail(drink_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("random_cocktail", {
        title: "Random cocktail",
        description: "A random recipe.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await randomCocktail());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_ingredients", {
        title: "List ingredients",
        description: "All known ingredients.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listIngredients());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
