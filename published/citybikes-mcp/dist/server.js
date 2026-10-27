import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { network, networks, networkCapacity } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "citybikes-mcp", version: "1.0.0" });
    server.registerTool("networks", {
        title: "Networks",
        description: "All bike share networks.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await networks(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("network", {
        title: "Network",
        description: "Live stations for one network.",
        inputSchema: z.object({ id: z.string().describe("Network ID like bixi-montreal.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await network(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("network_search", {
        title: "Network search",
        description: "Search the CityBikes directory of bike share systems by name, id, operator, city or country, with a breakdown of how many networks operate in each country.",
        inputSchema: z.object({ query: z.string().describe("Name, id or operator fragment.").optional(), country: z.string().describe("Country fragment.").optional(), limit: z.number().describe("Max results.").optional(), summary: z.boolean().describe("List matches compactly.").optional() }),
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
    server.registerTool("station_search", {
        title: "Station search",
        description: "Find stations inside a CityBikes network by name or by live availability, ranked by bikes free, with dock counts, coordinates, e-bike numbers and the data timestamp.",
        inputSchema: z.object({ network: z.string().describe("Network id, e.g. joco-new-york."), query: z.string().describe("Station name fragment.").optional(), has_bikes: z.boolean().describe("Only stations with bikes.").optional(), has_slots: z.boolean().describe("Only stations with empty slots.").optional(), limit: z.number().describe("Max stations.").optional() }),
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
    server.registerTool("network_capacity", {
        title: "Network capacity",
        description: "Live capacity statistics for a CityBikes network: free bikes and empty docks in total, share of stations stocked, completely full and empty stations, e-bike availability and the spread of bikes per station.",
        inputSchema: z.object({ network: z.string().describe("Network id, e.g. joco-new-york.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await networkCapacity(args));
        }
        catch (e) {
            return textError(e instanceof Error ? `Error: ${e.message}` : String(e));
        }
    });
    const serverName = "citybikes-mcp";
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
