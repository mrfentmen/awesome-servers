import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { nearby, getPoi, osmChargersNearby, chargerCoverageGap, chargeTimeEstimate } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "openchargemap-mcp",
        version: "1.0.0",
    });
    server.registerTool("nearby", {
        title: "Nearby chargers",
        description: "Charging points near coordinates, with distance.",
        inputSchema: z.object({
            latitude: z.string().describe("e.g. 40.7128."),
            longitude: z.string().describe("e.g. -74.0060."),
            distance: z.string().describe("Radius miles (default 25).").optional(),
            max_results: z.string().describe("Max results (default 10, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ latitude, longitude, distance, max_results }) => {
        try {
            return text(await nearby(latitude, longitude, distance, max_results));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_poi", {
        title: "Charger details",
        description: "One charge point by id, with connectors and operator.",
        inputSchema: z.object({
            poi_id: z.string().describe("Chargepoint ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ poi_id }) => {
        try {
            return text(await getPoi(poi_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("osm_chargers_nearby", {
        title: "OSM chargers nearby",
        description: "Charging stations around a point, read from OpenStreetMap instead of the Open Charge Map registry: distance, connector types, power class, claimed bay count, operator, fee and access requirements, each with its OSM link.",
        inputSchema: z.object({
            lat: z.number().describe("Latitude, -90 to 90."),
            lon: z.number().describe("Longitude, -180 to 180."),
            radius_km: z.number().describe("Search radius in km, 0.1-50.").optional(),
            limit: z.number().describe("How many stations to show, 1-20.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await osmChargersNearby(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("charger_coverage_gap", {
        title: "Charging coverage gap",
        description: "Aggregate the charging coverage of an area from OpenStreetMap: how many stations, which connectors and power classes are recorded, how concentrated the operators are, how many require an app or card, and an explicit list of what is missing for a real trip.",
        inputSchema: z.object({
            lat: z.number().describe("Latitude, -90 to 90."),
            lon: z.number().describe("Longitude, -180 to 180."),
            radius_km: z.number().describe("Radius in km, 1-50.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await chargerCoverageGap(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("charge_time_estimate", {
        title: "Charge time estimate",
        description: "Charge time arithmetic computed locally: energy to move into the pack, the flat-power time nobody ever sees, and a segmented estimate with a modelled DC taper, so you can see where the time actually goes between 10 and 80%.",
        inputSchema: z.object({
            battery_kwh: z.number().describe("Usable battery capacity in kWh."),
            power_kw: z.number().describe("Charger rating in kW."),
            from_pct: z.number().describe("Starting state of charge, 0-100.").optional(),
            to_pct: z.number().describe("Target state of charge, 0-100.").optional(),
            efficiency_pct: z.number().describe("Charging efficiency, 50-100.").optional(),
            dc: z.boolean().describe("DC connection, default true. False models the on-board charger.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await chargeTimeEstimate(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "openchargemap-mcp";
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
