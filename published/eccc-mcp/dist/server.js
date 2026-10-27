import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listCollections, getCollection, queryCollection, inventorySummary } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "eccc-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_collections", {
        title: "List collections",
        description: "All MSC GeoMet collections: weather, climate, water datasets and products.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listCollections());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_collection", {
        title: "Get collection info",
        description: "Metadata for one GeoMet collection: description, links, extent.",
        inputSchema: z.object({
            collectionId: z.string().describe("Collection id from list_collections"),
        }),
        annotations: READ_ONLY,
    }, async ({ collectionId }) => {
        try {
            return text(await getCollection(collectionId));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("query_collection", {
        title: "Query collection items",
        description: "Query items in a GeoMet collection with optional bounding box.",
        inputSchema: z.object({
            collectionId: z.string().describe("Collection id"),
            bbox: z.string().optional().describe("Bounding box 'minlon,minlat,maxlon,maxlat'"),
            limit: z.number().default(10).describe("How many items"),
        }),
        annotations: READ_ONLY,
    }, async ({ collectionId, bbox, limit }) => {
        try {
            return text(await queryCollection(collectionId, bbox, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_collections", {
        title: "Search collections",
        description: "Find the MSC GeoMet collection that carries a subject: matches on id, title, description and keywords, with item type, keywords and spatial and temporal coverage.",
        inputSchema: z.object({
            query: z.string().describe("Search terms, e.g. hurricane, climate, hydrometric"),
            limit: z.number().describe("Max results, 1-50.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement collections locally (paywall removed)
        try {
            return textError("Not yet implemented: collections");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("inventory_summary", {
        title: "Inventory summary",
        description: "Tally what a point-based GeoMet collection holds inside a bounding box: how many items match, how many carry point geometry, and the breakdown by province or territory and by status, instead of listing every row.",
        inputSchema: z.object({
            collectionId: z.string().describe("Collection id, e.g. hydrometric-stations"),
            bbox: z.string().optional().describe("Bounding box 'minlon,minlat,maxlon,maxlat'"),
            limit: z.number().describe("How many items to inspect, 1-500.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await inventorySummary(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("nearest_items", {
        title: "Nearest items",
        description: "What sits nearest a point in any point-based GeoMet collection: sends the search box itself, then ranks the returned point geometry by real great-circle distance.",
        inputSchema: z.object({
            collectionId: z.string().describe("Collection id, e.g. hydrometric-stations"),
            lon: z.number().describe("Longitude, -180 to 180."),
            lat: z.number().describe("Latitude, -90 to 90."),
            radiusKm: z.number().describe("Search radius in km, 1-400.").optional(),
            limit: z.number().describe("Max results, 1-40.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement items locally (paywall removed)
        try {
            return textError("Not yet implemented: items");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("item_detail", {
        title: "Item detail",
        description: "One MSC GeoMet collection item by id, with every property the service holds for it. The other tools reach a collection by listing it or by bounding box, so the row behind an id you already hold is not readable through them.",
        inputSchema: z.object({ collectionId: z.string().describe("Collection id, e.g. hydrometric-stations."), itemId: z.string().describe("Item id within that collection, e.g. 01AA002.") }),
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
    const serverName = "eccc-mcp";
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
    return server;
}
