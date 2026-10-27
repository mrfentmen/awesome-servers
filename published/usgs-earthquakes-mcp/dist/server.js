import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { m0_recent, m1_byPlace, m2_formatQuake, m2_latestQuakes, m2_queryQuakes } from "./api.js";
const text = (value) => ({ content: [{ type: 'text', text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
const errorMessage = error;
export function createServer() {
    const server = new McpServer({ name: 'usgs-earthquakes-mcp', version: '1.0.0' });
    server.registerTool("recent", {
        title: "Recent",
        description: "Recent earthquakes in the last day.",
        inputSchema: z.object({ minMagnitude: z.number().describe("Minimum magnitude.").optional(), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m0_recent(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("byPlace", {
        title: "By Place",
        description: "Earthquakes near a place name.",
        inputSchema: z.object({ place: z.string().describe("Place keyword, for example California."), limit: z.number().describe("Maximum results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m1_byPlace(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("latest_quakes", {
        title: "Latest quakes",
        description: "Latest earthquakes from the USGS feed.",
        inputSchema: z.object({
            magnitude: z.enum(["all", "1.0", "2.5", "4.5"]).default("2.5").describe("Minimum magnitude band"),
            timeframe: z.enum(["hour", "day", "week", "month"]).default("day").describe("Lookback window"),
            limit: z.number().int().min(1).max(50).default(15),
        }),
        annotations: READ_ONLY,
    }, async ({ magnitude, timeframe, limit }) => {
        try {
            const quakes = await m2_latestQuakes(magnitude, timeframe, limit);
            if (quakes.length === 0)
                return text(`No M${magnitude}+ quakes in the last ${timeframe}.`);
            return text(`Latest M${magnitude}+ earthquakes (${timeframe}):\n\n${quakes.map((q, i) => `${i + 1}. ${m2_formatQuake(q)}`).join("\n\n")}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("query_quakes", {
        title: "Query quakes",
        description: "Query earthquakes by magnitude, count, and start time.",
        inputSchema: z.object({
            minMagnitude: z.number().min(0).max(10).default(4.5).describe("Minimum magnitude"),
            limit: z.number().int().min(1).max(50).default(10),
            starttime: z.string().optional().describe("Start time, e.g. '2026-08-01'"),
        }),
        annotations: READ_ONLY,
    }, async ({ minMagnitude, limit, starttime }) => {
        try {
            const quakes = await m2_queryQuakes(minMagnitude, limit, starttime);
            if (quakes.length === 0)
                return text(`No quakes M${minMagnitude}+${starttime ? ` since ${starttime}` : ""}.`);
            return text(`Quakes M${minMagnitude}+${starttime ? ` since ${starttime}` : ""}:\n\n${quakes.map((q, i) => `${i + 1}. ${m2_formatQuake(q)}`).join("\n\n")}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("nearby_quakes", {
        title: "Nearby quakes",
        description: "Earthquakes within a radius of a point, nearest-relevant listing with distance from the point, depth and event id.",
        inputSchema: z.object({ lat: z.number().min(-90).max(90).describe("Latitude."), lon: z.number().min(-180).max(180).describe("Longitude."), radiusKm: z.number().int().min(1).max(20000).default(200), minMagnitude: z.number().min(-2).max(10).default(0), limit: z.number().int().min(1).max(50).default(10) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement quakes locally (paywall removed)
        try {
            return textError("Not yet implemented: quakes");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("event_detail", {
        title: "Event detail",
        description: "Full USGS record for one earthquake event id: review status, felt reports, shake intensity, alert level, tsunami flag and significance.",
        inputSchema: z.object({ eventId: z.string().min(1).max(40).describe("USGS event id like us7000thv6.") }),
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
    const serverName = "usgs-earthquakes-mcp";
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
