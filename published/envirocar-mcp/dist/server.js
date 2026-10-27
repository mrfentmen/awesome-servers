import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { sensors, trackDetail, tracks, platformStatistics } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "envirocar-mcp", version: "1.0.0" });
    server.registerTool("tracks", {
        title: "Tracks",
        description: "List recent tracks.",
        inputSchema: z.object({ limit: z.number().describe("Max tracks.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await tracks(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("track_detail", {
        title: "Track detail",
        description: "Get a track by id.",
        inputSchema: z.object({ id: z.string().describe("Track id.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await trackDetail(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("sensors", {
        title: "Sensors",
        description: "List available sensor definitions.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await sensors(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("track_statistics", {
        title: "Track statistics",
        description: "Per-phenomenon average, minimum and maximum for one enviroCar track, so you can read a drive rather than a single sample.",
        inputSchema: z.object({ id: z.string().describe("Track id.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement statistics locally (paywall removed)
        try {
            return textError("Not yet implemented: statistics");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("phenomenon_catalog", {
        title: "Phenomenon catalog",
        description: "The environmental and engine quantities enviroCar measures, with the unit each is reported in.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement catalog locally (paywall removed)
        try {
            return textError("Not yet implemented: catalog");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("platform_statistics", {
        title: "Platform statistics",
        description: "Platform-wide enviroCar coverage per phenomenon: average, measurement count, tracks, contributors and sensors.",
        inputSchema: z.object({ limit: z.number().describe("How many phenomena, 1-30.").optional(), phenomenon: z.string().describe("Only phenomena whose name contains this text.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await platformStatistics(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "envirocar-mcp";
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
