import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { agencies, predictions, routes, routeFrequency } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "nextbus-mcp", version: "1.0.0" });
    server.registerTool("agencies", {
        title: "Agencies",
        description: "List transit agencies.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await agencies(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("routes", {
        title: "Routes",
        description: "List routes for an agency.",
        inputSchema: z.object({ agency: z.string().describe("Agency tag.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await routes(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("predictions", {
        title: "Predictions",
        description: "Get arrival predictions for a stop.",
        inputSchema: z.object({ agency: z.string().describe("Agency tag."), stop: z.string().describe("Stop id."), route: z.string().describe("Route tag.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await predictions(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("route_timetable", {
        title: "Route timetable",
        description: "Full published timetable for a route: stop sequence, first and last departure, and the typical run time between consecutive stops.",
        inputSchema: z.object({ agency: z.string().describe("Agency tag."), route: z.string().describe("Route tag."), stopId: z.string().describe("Schedule stop id, 0 for all.").default("0"), maxStops: z.number().int().min(1).max(60).default(20) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement timetable locally (paywall removed)
        try {
            return textError("Not yet implemented: timetable");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("route_frequency", {
        title: "Route frequency",
        description: "How often a route actually runs at each stop: median headway plus the tightest and longest daytime gap from the published timetable.",
        inputSchema: z.object({ agency: z.string().describe("Agency tag."), route: z.string().describe("Route tag."), stopId: z.string().describe("Schedule stop id, 0 for all.").default("0"), maxStops: z.number().int().min(1).max(60).default(20) }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await routeFrequency(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "nextbus-mcp";
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
