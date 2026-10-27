import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { coordinates, geocode, coordinateGeographies } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "census-geo-mcp", version: "1.0.0" });
    server.registerTool("geocode", {
        title: "Geocode",
        description: "Geocode a street address.",
        inputSchema: z.object({ address: z.string().describe("Street address.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await geocode(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("coordinates", {
        title: "Coordinates",
        description: "Reverse geocode coordinates.",
        inputSchema: z.object({ x: z.number().describe("Longitude."), y: z.number().describe("Latitude.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await coordinates(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("address_geographies", {
        title: "Address geographies",
        description: "Every census geography an address falls in: state, county, tract, place, congressional district and more.",
        inputSchema: z.object({ address: z.string().describe("Street address, e.g. '1600 Pennsylvania Ave NW Washington DC'.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement geographies locally (paywall removed)
        try {
            return textError("Not yet implemented: geographies");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("coordinate_geographies", {
        title: "Coordinate geographies",
        description: "Every census geography a longitude/latitude falls in: state, county, tract, place, congressional district and more.",
        inputSchema: z.object({ x: z.number().describe("Longitude."), y: z.number().describe("Latitude.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await coordinateGeographies(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "census-geo-mcp";
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
    server.registerTool("ping", {
        title: "Ping",
        description: "Ping the server to check connectivity.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("pong");
    });
    return server;
}
