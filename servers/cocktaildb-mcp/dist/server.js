import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, searchCocktails, getCocktail, randomCocktail, listIngredients, filterCocktails, ingredientInfo, listFilters, searchByLetter, filterMultiIngredient, catalogueIndex } from "./api.js";
import { premiumTool } from "./gateway.js";
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
        description: "Find cocktails by name. Returns matching drinks with their category, glass and id — pass an id to get_cocktail for the full recipe.",
        inputSchema: z.object({
            query: z.string().describe("Cocktail name, e.g. margarita."),
            limit: z.number().describe("How many matches to list, 1-25 (default 10).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            return text(await searchCocktails({ query, limit }));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_cocktail", {
        title: "Get cocktail",
        description: "Full recipe for one drink: ingredients with measures, instructions, glass, category and image URL. Needs a drink id from search_cocktails or filter_cocktails.",
        inputSchema: z.object({
            drink_id: z.string().describe("Drink id, e.g. 11007.")
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
        description: "One or more random cocktail recipes, useful for suggestions and inspiration.",
        inputSchema: z.object({
            count: z.number().describe("How many random recipes, 1-3 (default 1).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ count }) => {
        try {
            return text(await randomCocktail(count));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_ingredients", {
        title: "List ingredients",
        description: "Known ingredients in the cocktail database, optionally filtered by a substring. Use the exact names with filter_cocktails and ingredient_info.",
        inputSchema: z.object({
            search: z.string().describe("Substring to filter ingredient names, e.g. vodka.").optional(),
            limit: z.number().describe("How many names to list, 1-200 (default 40).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ search, limit }) => {
        try {
            return text(await listIngredients({ search, limit }));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("filter_cocktails", {
        title: "Filter cocktails",
        description: "Browse cocktails by one attribute: an ingredient they contain, a category, a glass type, or an alcohol option. Returns drink names with ids.",
        inputSchema: z.object({
            by: z.string().describe("ingredient, category, glass, or alcohol."),
            value: z.string().describe("Value to match, e.g. Gin, Cocktail, Cocktail glass, Non alcoholic."),
            limit: z.number().describe("How many drinks to list, 1-50 (default 20).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ by, value, limit }) => {
        try {
            return text(await filterCocktails({ by, value, limit }));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("ingredient_info", {
        title: "Ingredient info",
        description: "Profile of one ingredient: type, whether it contains alcohol, ABV, and a description of what it is.",
        inputSchema: z.object({
            name: z.string().describe("Ingredient name, e.g. Gin.")
        }),
        annotations: READ_ONLY,
    }, async ({ name }) => {
        try {
            return text(await ingredientInfo(name));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_filters", {
        title: "List filters",
        description: "The valid values for filter_cocktails: drink categories, glass types and alcohol options.",
        inputSchema: z.object({
            kind: z.string().describe("categories, glasses, alcohol, or all (default all).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ kind }) => {
        try {
            return text(await listFilters(kind));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("search_by_letter", {
        title: "Browse by letter",
        description: "List every cocktail whose name starts with one letter, for browsing the database alphabetically.",
        inputSchema: z.object({
            letter: z.string().describe("Single letter a-z, e.g. m."),
            limit: z.number().describe("How many drinks to list, 1-50 (default 20).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ letter, limit }) => {
        try {
            return text(await searchByLetter(letter, limit));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("filter_multi_ingredient", {
        title: "Filter by several ingredients",
        description: "Cocktails that contain all of the listed ingredients at once, e.g. Gin and Tonic water — the recipe finder for what is already in the bar.",
        inputSchema: z.object({
            ingredients: z.string().describe("Two to six ingredient names, comma separated, e.g. Gin,Tonic water."),
            limit: z.number().describe("How many drinks to list, 1-50 (default 20).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ ingredients, limit }) => {
        try {
            return text(await filterMultiIngredient(ingredients, limit));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("drink_record_audit", {
        title: "Drink record audit",
        description: "The complete TheCocktailDB record for one drink, including the fields a plain recipe lookup throws away: IBA class, tags, alternate name, video, every translated instruction the site holds, image source, attribution and Creative Commons status, last-modified date, and a data-quality verdict covering empty ingredient slots, ingredients with no measure, and an unconfirmed image licence.",
        inputSchema: z.object({
            id: z.string().describe("Drink id, for example 11007 for a Margarita."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: drink_record_audit ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_cocktaildb_drink_record_audit", args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("catalogue_index", {
        title: "Catalogue index",
        description: "The A to Z shape of what TheCocktailDB will actually serve on the free API: distinct drink count, per-letter counts with first and last name, and an explicit note on which letters sit at the 25-row cap and are therefore incomplete.",
        inputSchema: z.object({
            refresh: z.string().optional().describe('Pass "true" to refetch all 26 letters instead of using the cached index.'),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await catalogueIndex(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("name_variants", {
        title: "Drink name families",
        description: "Groups the reachable catalogue into drink name families, so a base drink and its variants read as one family. A drink joins the longest family name that is itself a drink in the data, which puts \"Tommy's Margarita\" under \"Margarita\" but only groups \"Moscow Mule\" with \"Mule\" if Mule really is a drink.",
        inputSchema: z.object({
            refresh: z.string().optional().describe('Pass "true" to refetch all 26 letters instead of using the cached index.'),
            top: z.number().int().min(1).max(40).default(15).describe("Families to show, default 15"),
            min_family: z.number().int().min(2).max(20).default(2).describe("Smallest family worth showing, default 2"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: name_variants ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_cocktaildb_name_variants", args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
