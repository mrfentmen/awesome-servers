import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { lookup, ipNetwork, reverseGeocode, timezoneAt } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "freegeoip-mcp", version: "1.0.0" });
    server.registerTool("lookup", {
        title: "Lookup",
        description: "Look up an IP address.",
        inputSchema: z.object({ ip: z.string().describe("IP address.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await lookup(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("ip_network", {
        title: "IP network",
        description: "Network operator behind an IP address: ASN, organisation, ISP, reverse domain and dialling code.",
        inputSchema: z.object({ ip: z.string().describe("IP address.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await ipNetwork(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("ip_registration", {
        title: "IP registration",
        description: "RDAP registration record for an IP address: registered network, handle, allocated range, CIDR, registry country and abuse contact.",
        inputSchema: z.object({ ip: z.string().describe("IP address.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement registration locally (paywall removed)
        try {
            return textError("Not yet implemented: registration");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("geocode_place", {
        title: "Geocode a place",
        description: "Turn a place name into coordinates, elevation, time zone, country and population, with several candidate matches ranked.",
        inputSchema: z.object({ query: z.string().describe("Place name, e.g. a city or landmark."), limit: z.number().describe("Max matches, 1-10.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement place locally (paywall removed)
        try {
            return textError("Not yet implemented: place");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("reverse_geocode", {
        title: "Reverse geocode",
        description: "Turn a latitude and longitude into the place name, postal address and OpenStreetMap reference for that point.",
        inputSchema: z.object({ latitude: z.number().describe("Latitude, -90 to 90."), longitude: z.number().describe("Longitude, -180 to 180.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await reverseGeocode(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("timezone_at", {
        title: "Time zone at a point",
        description: "IANA time zone, current local time, UTC offset and daylight saving state for a latitude and longitude.",
        inputSchema: z.object({ latitude: z.number().describe("Latitude, -90 to 90."), longitude: z.number().describe("Longitude, -180 to 180.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await timezoneAt(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "freegeoip-mcp";
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
