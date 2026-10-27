import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { clientIp, reverseGeocode, distanceBetween } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "bigdatacloud-mcp", version: "1.0.0" });
    server.registerTool("client_ip", {
        title: "Client ip",
        description: "Get caller IP details.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await clientIp(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("reverse_geocode", {
        title: "Reverse geocode",
        description: "Reverse geocode coordinates to a location.",
        inputSchema: z.object({ lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await reverseGeocode(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("location_hierarchy", {
        title: "Location hierarchy",
        description: "Every administrative level above a point, with admin level, ISO code, Wikidata id and GeoNames id.",
        inputSchema: z.object({ lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement hierarchy locally (paywall removed)
        try {
            return textError("Not yet implemented: hierarchy");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("location_codes", {
        title: "Location codes",
        description: "Continent, country, subdivision and postcode codes for a point, plus its Open Location Code.",
        inputSchema: z.object({ lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement codes locally (paywall removed)
        try {
            return textError("Not yet implemented: codes");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("distance_between", {
        title: "Distance between",
        description: "Great circle distance and initial bearing between two points, naming both places.",
        inputSchema: z.object({ lat1: z.number().describe("First latitude."), lon1: z.number().describe("First longitude."), lat2: z.number().describe("Second latitude."), lon2: z.number().describe("Second longitude.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await distanceBetween(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "bigdatacloud-mcp";
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
