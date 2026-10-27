import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { bike, search, manufacturerCatalogue } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "bikeindex-mcp", version: "1.0.0" });
    server.registerTool("search", {
        title: "Search",
        description: "Search bikes.",
        inputSchema: z.object({ query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await search(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("bike", {
        title: "Bike",
        description: "Get a bike by id.",
        inputSchema: z.object({ id: z.number().describe("Bike id.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await bike(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("stolen_bikes", {
        title: "Stolen bikes",
        description: "Browse the Bike Index stolen bike register with manufacturer, frame model, colour, type, theft date, last known city and description, optionally restricted to a recent window.",
        inputSchema: z.object({ limit: z.number().describe("Max records.").optional(), page: z.number().describe("Page of the stolen index.").optional(), days_ago: z.number().describe("Only bikes stolen within this many days.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement bikes locally (paywall removed)
        try {
            return textError("Not yet implemented: bikes");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("bikes_near", {
        title: "Bikes near a location",
        description: "Find bikes registered on Bike Index within a radius of a latitude and longitude, with a manufacturer breakdown and full records, optionally restricted to stolen bikes.",
        inputSchema: z.object({ lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude."), distance: z.number().describe("Radius in km.").optional(), stolen_only: z.boolean().describe("Only stolen bikes.").optional(), limit: z.number().describe("Max records.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement near locally (paywall removed)
        try {
            return textError("Not yet implemented: near");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("manufacturer_catalogue", {
        title: "Manufacturer catalogue",
        description: "List Bike Index registered bikes for a manufacturer with a frame model breakdown, or search the manufacturer catalogue itself for company details and websites.",
        inputSchema: z.object({ manufacturer: z.string().describe("Manufacturer name, e.g. Trek."), search_catalogue: z.boolean().describe("Search the manufacturer catalogue instead of the bike register.").optional(), limit: z.number().describe("Max records.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await manufacturerCatalogue(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "bikeindex-mcp";
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
