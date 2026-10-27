import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { moonOnDate, moonPhase } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "moon-phase-mcp", version: "1.0.0" });
    server.registerTool("moon_phase", {
        title: "Moon phase",
        description: "Get the current moon phase and illumination.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await moonPhase(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("moon_on_date", {
        title: "Moon on date",
        description: "Get the moon phase for a date.",
        inputSchema: z.object({ date: z.string().describe("Date in YYYY-MM-DD format.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await moonOnDate(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("predicted_phases", {
        title: "Predicted phases",
        description: "The next moon phase events from the US Naval Observatory: new moon, first quarter, full moon and last quarter with their UTC times.",
        inputSchema: z.object({ date: z.string().describe("Start date as YYYY-MM-DD. Defaults to today.").optional(), count: z.number().describe("How many phase events, 1-20, default 4.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement phases locally (paywall removed)
        try {
            return textError("Not yet implemented: phases");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("moon_times", {
        title: "Moon times",
        description: "Moonrise, moonset, sun times and twilight for a coordinate and date from the US Naval Observatory, with the phase and illuminated fraction for that place.",
        inputSchema: z.object({ date: z.string().describe("Date as YYYY-MM-DD. Defaults to today.").optional(), latitude: z.number().describe("Latitude between -90 and 90."), longitude: z.number().describe("Longitude between -180 and 180."), tz: z.number().describe("UTC offset in hours, -14 to 14. Defaults to 0.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement times locally (paywall removed)
        try {
            return textError("Not yet implemented: times");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "moon-phase-mcp";
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
