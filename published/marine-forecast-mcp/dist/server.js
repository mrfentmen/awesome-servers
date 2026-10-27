import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { forecast } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "marine-forecast-mcp", version: "1.0.0" });
    server.registerTool("forecast", {
        title: "Forecast",
        description: "Marine forecast for a location.",
        inputSchema: z.object({ latitude: z.number().describe("Latitude."), longitude: z.number().describe("Longitude."), days: z.number().describe("Forecast days.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await forecast(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("daily_summary", {
        title: "Daily summary",
        description: "Day by day maximum wave height, maximum wave period and dominant wave direction for a sea point.",
        inputSchema: z.object({ latitude: z.number().describe("Latitude."), longitude: z.number().describe("Longitude."), days: z.number().int().min(1).max(8).default(3) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement summary locally (paywall removed)
        try {
            return textError("Not yet implemented: summary");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("wave_partition", {
        title: "Wave partition",
        description: "The current sea state split into wind wave and swell: height, direction and period of each, plus sea surface temperature.",
        inputSchema: z.object({ latitude: z.number().describe("Latitude."), longitude: z.number().describe("Longitude.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement partition locally (paywall removed)
        try {
            return textError("Not yet implemented: partition");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "marine-forecast-mcp";
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
    server.registerTool("help", {
        title: "Help",
        description: "Get help and usage information.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("This MCP server provides several tools. See tools/list for details.");
    });
    return server;
}
