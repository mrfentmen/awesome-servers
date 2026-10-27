import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { locate, distanceBetween } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "geolocation-db-mcp", version: "1.0.0" });
    server.registerTool("locate", {
        title: "Locate",
        description: "Location for your IP or one IP.",
        inputSchema: z.object({ ip: z.string().describe("IP address.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await locate(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("locate_many", {
        title: "Locate many",
        description: "Look up several IPv4 or IPv6 addresses at once and report each location, a country tally, and any address the database could not resolve.",
        inputSchema: z.object({ ips: z.string().describe("IP addresses separated by spaces or commas, up to 20.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement many locally (paywall removed)
        try {
            return textError("Not yet implemented: many");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("distance_between", {
        title: "Distance between",
        description: "Great-circle distance and initial bearing between the locations of two IP addresses.",
        inputSchema: z.object({ from: z.string().describe("First IP address."), to: z.string().describe("Second IP address.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await distanceBetween(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "geolocation-db-mcp";
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
