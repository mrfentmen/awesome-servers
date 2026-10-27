import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { app } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "steamspy-mcp", version: "1.0.0" });
    server.registerTool("app", {
        title: "App",
        description: "Player statistics for one Steam app.",
        inputSchema: z.object({ appid: z.number().describe("Steam app id.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await app(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("genre_apps", {
        title: "Genre apps",
        description: "Steam games in a named Steam genre, with developer, estimated owner range and review counts.",
        inputSchema: z.object({ genre: z.string().describe("Steam genre, e.g. \"Early Access\"."), limit: z.number().int().min(1).max(100).default(20).describe("Max results.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement apps locally (paywall removed)
        try {
            return textError("Not yet implemented: apps");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("top_owned", {
        title: "Top owned",
        description: "SteamSpy's most owned games chart, with developer, estimated owner range and review counts.",
        inputSchema: z.object({ limit: z.number().int().min(1).max(100).default(20).describe("Max results.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement owned locally (paywall removed)
        try {
            return textError("Not yet implemented: owned");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "steamspy-mcp";
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
