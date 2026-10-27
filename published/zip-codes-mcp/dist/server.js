import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { cityLookup, zipLookup, nearbyPostcodes, postcodeAutocomplete } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "zip-codes-mcp", version: "1.0.0" });
    server.registerTool("zip_lookup", {
        title: "Zip lookup",
        description: "Get the city and state for a US zip code.",
        inputSchema: z.object({ zip: z.string().describe("Five digit US zip code.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await zipLookup(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("city_lookup", {
        title: "City lookup",
        description: "List zip codes for a city and state.",
        inputSchema: z.object({ city: z.string().describe("City name."), state: z.string().describe("Two letter state code.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await cityLookup(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("reverse_geocode", {
        title: "Reverse geocode",
        description: "Turn a latitude and longitude into the post code, city, state and country that OpenStreetMap Nominatim has for that point.",
        inputSchema: z.object({ latitude: z.number().describe("Latitude, -90 to 90."), longitude: z.number().describe("Longitude, -180 to 180.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement geocode locally (paywall removed)
        try {
            return textError("Not yet implemented: geocode");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("address_search", {
        title: "Address search",
        description: "Search worldwide addresses and places through OpenStreetMap Nominatim.",
        inputSchema: z.object({ query: z.string().describe("Address or place query."), limit: z.number().optional().describe("Results, 1-10; default 5.") }),
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
    server.registerTool("nearby_postcodes", {
        title: "Nearby postcodes",
        description: "Find UK postcodes near coordinates through postcodes.io.",
        inputSchema: z.object({ latitude: z.number().describe("Latitude."), longitude: z.number().describe("Longitude."), radius: z.number().optional().describe("Radius in metres, 100-10000; default 5000."), limit: z.number().optional().describe("Results, 1-100; default 10.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await nearbyPostcodes(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("postcode_autocomplete", {
        title: "Postcode autocomplete",
        description: "Complete a UK postcode prefix through postcodes.io.",
        inputSchema: z.object({ postcode: z.string().describe("Postcode or prefix, e.g. SW1A."), limit: z.number().optional().describe("Completions, 1-20; default 10.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await postcodeAutocomplete(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "zip-codes-mcp";
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
