import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { dateSearch, errorMessage, facetSearch, searchItems, getItem, getCollection, placeSearch, searchCollections, sortedSearch, titleSearch, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "dpla-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_items", {
        title: "Search items",
        description: "Search DPLA's millions of photos, books, maps and recordings.",
        inputSchema: z.object({
            query: z.string().describe("Search text"),
            pageSize: z.number().default(10).describe("Results, max 500"),
        }),
        annotations: READ_ONLY,
    }, async ({ query, pageSize }) => {
        try {
            return text(await searchItems(query, pageSize));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_item", {
        title: "Get item detail",
        description: "Full DPLA record with source links and rights info.",
        inputSchema: z.object({
            itemId: z.string().describe("Item id"),
        }),
        annotations: READ_ONLY,
    }, async ({ itemId }) => {
        try {
            return text(await getItem(itemId));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("search_collections", {
        title: "Search collections",
        description: "Search DPLA partner collections and exhibitions.",
        inputSchema: z.object({
            query: z.string().describe("Search text"),
        }),
        annotations: READ_ONLY,
    }, async ({ query }) => {
        try {
            return text(await searchCollections(query));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_collection", {
        title: "Get collection",
        description: "One DPLA collection by id.",
        inputSchema: z.object({
            collectionId: z.string().describe("Collection id"),
        }),
        annotations: READ_ONLY,
    }, async ({ collectionId }) => {
        try {
            return text(await getCollection(collectionId));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("title_search", {
        title: "Title search",
        description: "Items by exact title words.",
        inputSchema: z.object({
            title: z.string().describe("Title words"),
            pageSize: z.number().default(10).describe("Results, max 500"),
        }),
        annotations: READ_ONLY,
    }, async ({ title, pageSize }) => {
        try {
            return text(await titleSearch(title, pageSize));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("date_search", {
        title: "Date search",
        description: "Items created between dates.",
        inputSchema: z.object({
            after: z.string().describe("After YYYY-MM-DD"),
            before: z.string().describe("Before YYYY-MM-DD"),
            pageSize: z.number().default(10).describe("Results, max 500"),
        }),
        annotations: READ_ONLY,
    }, async ({ after, before, pageSize }) => {
        try {
            return text(await dateSearch(after, before, pageSize));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("place_search", {
        title: "Place search",
        description: "Items in or about a place.",
        inputSchema: z.object({
            place: z.string().describe("Place like Boston"),
            pageSize: z.number().default(10).describe("Results, max 500"),
        }),
        annotations: READ_ONLY,
    }, async ({ place, pageSize }) => {
        try {
            return text(await placeSearch(place, pageSize));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("sorted_search", {
        title: "Sorted search",
        description: "Items sorted by a field.",
        inputSchema: z.object({
            query: z.string().describe("Search text"),
            sortBy: z.string().describe("Field like sourceResource.title"),
            pageSize: z.number().default(10).describe("Results, max 500"),
        }),
        annotations: READ_ONLY,
    }, async ({ query, sortBy, pageSize }) => {
        try {
            return text(await sortedSearch(query, sortBy, pageSize));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("facet_search", {
        title: "Facet search",
        description: "Top values for a field.",
        inputSchema: z.object({
            query: z.string().describe("Search text"),
            facet: z.string().describe("Field like sourceResource.type"),
        }),
        annotations: READ_ONLY,
    }, async ({ query, facet }) => {
        try {
            return text(await facetSearch(query, facet));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
